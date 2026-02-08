const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');
const Reservation = require('../models/Reservation');

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
