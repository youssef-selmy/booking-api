const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');
const Reservation = require('../models/Reservation');
const Room = require("../models/roomModel");
// @desc    Get list of reservations
// @route   GET /api/v1/reservations
// @access  Private/Admin
exports.getReservations = factory.getAll(Reservation);

// @desc    Get specific reservation by id
// @route   GET /api/v1/reservations/:id
// @access  Private/Admin
exports.getReservation = factory.getOne(Reservation);

// @desc    Create reservation
// @route   POST /api/v1/reservations
// @access  Private/Admin
exports.createReservation = factory.createOne(Reservation);

// @desc    Update specific reservation
// @route   PUT /api/v1/reservations/:id
// @access  Private/Admin
exports.updateReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return next(new ApiError("Reservation not found", 404));
  }

  // Update main guest
  if (req.body.mainGuest) {
    reservation.mainGuest.firstName = req.body.mainGuest.firstName ?? reservation.mainGuest.firstName;
    reservation.mainGuest.lastName = req.body.mainGuest.lastName ?? reservation.mainGuest.lastName;
    reservation.mainGuest.age = req.body.mainGuest.age ?? reservation.mainGuest.age;
  }

  // Update additional guests
  if (req.body.additionalGuests) {
    reservation.additionalGuests = req.body.additionalGuests;
  }

  // Update rooms
  if (req.body.rooms) {
    reservation.rooms = req.body.rooms;
  }

  // Update services and packages
  if (req.body.services) reservation.services = req.body.services;
  if (req.body.packages) reservation.packages = req.body.packages;

  // Update payments
  if (req.body.payments) reservation.payments = req.body.payments;

  // Update status
  if (req.body.status) reservation.status = req.body.status;

  // Save triggers pre-save middleware to recalc totals
  await reservation.save();

  res.status(200).json({
    status: "success",
    data: reservation,
  });
});

// @desc    Delete specific reservation
// @route   DELETE /api/v1/reservations/:id
// @access  Private/Admin
exports.deleteReservation = factory.deleteOne(Reservation);






exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, ...filters } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        status: "fail",
        message: "checkIn and checkOut are required"
      });
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (startDate >= endDate) {
      return res.status(400).json({
        status: "fail",
        message: "checkOut must be after checkIn"
      });
    }

    const hotelId = req.user.hotel;

    // ✅ 1. Find overlapping reservations
    const overlappingReservations = await Reservation.find({
      hotel: hotelId,
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate }
    }).select("rooms.room");

    // ✅ 2. Extract booked room IDs safely
    const bookedRoomIds = [
      ...new Set(
        overlappingReservations.flatMap(res =>
          res.rooms.map(r => {
            if (!r.room) return null;
            if (typeof r.room === "object" && r.room._id)
              return r.room._id.toString();
            return r.room.toString();
          })
        ).filter(Boolean)
      )
    ];

    // ✅ 3. Build base query
    let roomQuery = {
      hotel: hotelId,
      _id: { $nin: bookedRoomIds }
    };

    // ✅ 4. Apply dynamic filters
    Object.keys(filters).forEach(key => {

      // numeric fields
      if (["maxGuests", "MaxChildren", "floor"].includes(key)) {
        roomQuery[key] = Number(filters[key]);
      }

      // ObjectId fields
      else if (["category", "type", "_id"].includes(key)) {
        roomQuery[key] = filters[key];
      }

      // createdAt range filtering
      else if (key === "createdFrom") {
        roomQuery.createdAt = { ...roomQuery.createdAt, $gte: new Date(filters[key]) };
      }
      else if (key === "createdTo") {
        roomQuery.createdAt = { ...roomQuery.createdAt, $lte: new Date(filters[key]) };
      }

      // text fields
      else {
        roomQuery[key] = { $regex: filters[key], $options: "i" };
      }
    });

    // ✅ 5. Query rooms
    const availableRooms = await Room.find(roomQuery)
      .populate("category")
      .populate("type")
      .lean();

    res.status(200).json({
      status: "success",
      results: availableRooms.length,
      data: availableRooms
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};


