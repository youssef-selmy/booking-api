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
    min: 1
  },

  perDay: {
    type: Number,
    required: true,
    min: 0
  },

  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Packages'
   // 🔥 ONE package per room
  },
  //   type: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'RoomType',
  //   required: true   // 🔥 ONE package per room
  // },
  //     category: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'RoomCategory',
  //   required: true   // 🔥 ONE package per room
  // },

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
    enum: ['pending', 'confirmed', 'canceled','completed'],
    default: 'pending'
  },
    alerts: {
    type: String,
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


reservationSchema.pre("save", async function (next) {
  try {
    // =============================
    // 🔎 Detect REAL booking changes
    // =============================

    const checkInChanged = this.isModified("checkIn");
    const checkOutChanged = this.isModified("checkOut");

    let roomsChanged = false;

    if (this.isModified("rooms")) {
      const original = this.$__.priorDoc;

      if (original) {
        const oldRoomIds = original.rooms.map(r => r.room.toString());
        const newRoomIds = this.rooms.map(r => r.room.toString());

        roomsChanged =
          oldRoomIds.length !== newRoomIds.length ||
          oldRoomIds.some((id, i) => id !== newRoomIds[i]);
      } else {
        roomsChanged = true; // new document
      }
    }

    const bookingFieldsChanged =
      checkInChanged || checkOutChanged || roomsChanged;

    // =============================
    // ✅ 1. Validate & Calculate Nights
    // =============================
    if (!this.checkIn || !this.checkOut) {
      return next(new Error("Check-in and Check-out dates are required"));
    }

    const checkInDate = new Date(this.checkIn);
    const checkOutDate = new Date(this.checkOut);

    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);

    if (checkOutDate <= checkInDate) {
      return next(new Error("Check-out must be after check-in"));
    }

    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    if (nights < 1) {
      return next(new Error("Stay must be at least 1 night"));
    }

    if (bookingFieldsChanged) {
      this.rooms.forEach(room => {
        room.nights = nights;
      });
    }

    // =============================
    // 🚫 2. Prevent Double Booking (ONLY when needed)
    // =============================
    if (bookingFieldsChanged) {
      for (const r of this.rooms) {
        const overlappingReservation =
          await mongoose.model("Reservation").findOne({
            _id: { $ne: this._id },
            "rooms.room": r.room,
            status: { $ne: "canceled" },
            checkIn: { $lt: this.checkOut },
            checkOut: { $gt: this.checkIn }
          });

        if (overlappingReservation) {
          return next(
            new Error("Room is already reserved for the selected dates")
          );
        }
      }
    }

    // =============================
    // 💰 3. Calculate Totals (safe always)
    // =============================
    let roomsTotal = 0;

for (const r of this.rooms) {
  let packagePrice = 0;

  // لو فيه package فقط
  if (r.package) {
    const packageDoc = await mongoose
      .model("Packages")
      .findById(r.package)
      .select("price");

    packagePrice = packageDoc?.price || 0; // 🔥 الحل هنا
  }

  r.total = (r.perDay * r.nights) + packagePrice;
  roomsTotal += r.total;
}


    let servicesTotal = 0;
    if (this.services?.length) {
      const servicesDocs = await mongoose
        .model("Services")
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
  } catch (error) {
    next(error);
  }
});




// ----------------- Auto-populate Middleware ----------------- //
function autoPopulateReservation(next) {
  this.populate({
    path: "rooms.room",
    populate: [
      {
        path: "type",
        model: "RoomType"
      },
      {
        path: "category",
        model: "RoomCategory"
      }
    ]
  })
  .populate({
    path: "rooms.package",
    model: "Packages"
  })
  .populate("services");

  next();
}

reservationSchema.pre("find", autoPopulateReservation);
reservationSchema.pre("findOne", autoPopulateReservation);
reservationSchema.pre("findById", autoPopulateReservation);


module.exports = mongoose.model('Reservation', reservationSchema);
