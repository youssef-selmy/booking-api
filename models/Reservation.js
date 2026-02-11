const mongoose = require('mongoose');

// =============================
// Guest Sub-schema
// =============================
const guestSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  age: { type: Number, min: 0 },
  nationality: String,
  idNumber: String
});

// =============================
// Payment Sub-schema
// =============================
const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

// =============================
// Reserved Room Sub-schema
// =============================
const reservedRoomSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },

  nights: {
    type: Number,
    required: true,
    min: 1
  },

  perDay: {
    type: Number,
    required: true,
    min: 0
  },

  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Packages',
    required: true   // 🔥 ONE package per room
  },

  total: {
    type: Number,
    default: 0
  }
});

// =============================
// Reservation Schema
// =============================
const reservationSchema = new mongoose.Schema({
  mainGuest: guestSchema,
  additionalGuests: [guestSchema],

  rooms: [reservedRoomSchema],

  services: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Services' }
  ], // reservation-level services

  payments: [paymentSchema],

  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled'],
    default: 'pending'
  },

  checkIn: Date,
  checkOut: Date,

  stayStatus: {
  type: String,
  enum: [
    'reserved',
    'checked-in',
    'checked-out'
  
  ],
  default: 'reserved'
},

// actualCheckIn: Date,
// actualCheckOut: Date,

}, { timestamps: true });


// ----------------- Pre-save Middleware ----------------- //
reservationSchema.pre('save', async function (next) {


     // 🔥 Prevent double booking
    for (const r of this.rooms) {

      const overlappingReservation = await mongoose.model('Reservation').findOne({
        _id: { $ne: this._id }, // exclude current reservation (important for updates)

        "rooms.room": r.room,

        status: { $ne: "canceled" },

        checkIn: { $lt: this.checkOut },
        checkOut: { $gt: this.checkIn }
      });

      if (overlappingReservation) {
        return next(
          new Error(`Room is already reserved for the selected dates`)
        );
      }
    }

  let roomsTotal = 0;

  for (const r of this.rooms) {
    if (!r.perDay || r.perDay < 0)
      return next(new Error(`Per day price is required for room ${r.room}`));

    if (!r.nights || r.nights < 1)
      return next(new Error(`Nights must be at least 1 for room ${r.room}`));

    // 🔥 Get package price
    const packageDoc = await mongoose
      .model('Packages')
      .findById(r.package);

    if (!packageDoc)
      return next(new Error(`Package not found for room ${r.room}`));

    const packagePrice = packageDoc.price || 0;

    // Room total = (perDay * nights) + package price
    r.total = (r.perDay * r.nights) + packagePrice;
    roomsTotal += r.total;
  }

  // Reservation-level services
  let servicesTotal = 0;
  if (this.services?.length) {
    const servicesDocs = await mongoose
      .model('Services')
      .find({ _id: { $in: this.services } });

    servicesTotal = servicesDocs.reduce(
      (sum, s) => sum + (s.price || 0),
      0
    );
  }

  this.totalAmount = roomsTotal + servicesTotal;
  this.paidAmount = this.payments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
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
  .populate('rooms.package') // 🔥 per-room package
  .populate('services');

  next();
}

reservationSchema.pre('find', autoPopulateReservation);
reservationSchema.pre('findOne', autoPopulateReservation);
reservationSchema.pre('findById', autoPopulateReservation);


module.exports = mongoose.model('Reservation', reservationSchema);
