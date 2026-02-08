const mongoose = require('mongoose');

// Sub-schema for Guest
const guestSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, min: 0 },
    nationality: { type: String },
    idNumber: { type: String }
});

// Sub-schema for Payment
const paymentSchema = new mongoose.Schema({
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Sub-schema for Room in Reservation
const reservedRoomSchema = new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
   nights: { type: Number, required: true, min: 1 },
    perDay: { type: Number, required: true, min: 0 }, 
    total: { type: Number, default: 0 }
});

// Main Reservation Schema
const reservationSchema = new mongoose.Schema({
    mainGuest: guestSchema,
    additionalGuests: [guestSchema],
    rooms: [reservedRoomSchema],
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Services' }], // Reservation-level services
    packages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Packages' }], // Reservation-level packages
    payments: [paymentSchema],
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'confirmed', 'canceled'], default: 'pending' }
}, { timestamps: true });

// ----------------- Pre-save Middleware ----------------- //
reservationSchema.pre('save', async function(next) {
    let roomsTotal = 0;

    for (const r of this.rooms) {
        const roomDoc = await mongoose.model('Room').findById(r.room)
            .populate('category type');

        if (!roomDoc) {
            return next(new Error(`Room with ID ${r.room} not found`));
        }

        if (!r.perDay || r.perDay < 0) {
            return next(new Error(`Per day price is required for room ${r.room}`));
        }

        if (!r.nights || r.nights < 1) {
            return next(new Error(`Number of nights must be at least 1 for room ${r.room}`));
        }

        // Total for this room
        r.total = r.perDay * r.nights;
        roomsTotal += r.total;
    }

    // Reservation-level services total
    let servicesTotal = 0;
    if (this.services?.length) {
        const servicesDocs = await mongoose.model('Services').find({ _id: { $in: this.services } });
        servicesTotal = servicesDocs.reduce((sum, s) => sum + (s.price || 0), 0);
    }

    // Reservation-level packages total
    let packagesTotal = 0;
    if (this.packages?.length) {
        const packagesDocs = await mongoose.model('Packages').find({ _id: { $in: this.packages } });
        packagesTotal = packagesDocs.reduce((sum, p) => sum + (p.price || 0), 0);
    }

    this.totalAmount = roomsTotal + servicesTotal + packagesTotal;
    this.paidAmount = this.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    this.remainingAmount = this.totalAmount - this.paidAmount;

    next();
});



// ----------------- Auto-populate Middleware ----------------- //
function autoPopulateReservation(next) {
    this.populate({
        path: 'rooms.room',
        populate: [
            { path: 'category', model: 'RoomCategory' },
            { path: 'type', model: 'RoomType' }
        ]
    })
    .populate('services')
    .populate('packages');

    next();
}

// Apply auto-populate to find queries
reservationSchema.pre('find', autoPopulateReservation);
reservationSchema.pre('findOne', autoPopulateReservation);
reservationSchema.pre('findById', autoPopulateReservation);

module.exports = mongoose.model('Reservation', reservationSchema);
