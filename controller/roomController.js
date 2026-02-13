const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');

const Room = require('../models/roomModel');




// @desc    Get list of rooms (for specific hotel)
// @route   GET /api/v1/rooms
// @access  Private/Admin
exports.getRooms = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  const rooms = await Room.find({ hotel: hotelId });

  res.status(200).json({
    results: rooms.length,
    data: rooms,
  });
});

// @desc    Get specific room by id (hotel protected)
exports.getRoom = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const room = await Room.findOne({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!room) {
    return next(new ApiError('Room not found for this hotel', 404));
  }

  res.status(200).json({
    data: room,
  });
});

// @desc    Create room for logged-in hotel
// @route   POST /api/v1/rooms
// @access  Private/Admin
exports.createRoom = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  // Never trust frontend
  req.body.hotel = hotelId;

  const room = await Room.create(req.body);

  res.status(201).json({
    success: true,
    data: room,
  });
});

// @desc    Update specific room (only same hotel)
exports.updateRoom = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const room = await Room.findOneAndUpdate(
    { _id: req.params.id, hotel: hotelId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!room) {
    return next(new ApiError('Room not found or not authorized', 404));
  }

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    Delete specific room (hotel protected)
exports.deleteRoom = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const room = await Room.findOneAndDelete({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!room) {
    return next(new ApiError('Room not found or not authorized', 404));
  }

  res.status(204).send();
});

const Hotel = require('../models/hotelModel');

exports.setHotelIdToBody = async (req, res, next) => {
  // Extra safety: never trust client
  if (req.body.hotel) delete req.body.hotel;

  // 🔎 Find hotel that contains this user
  const hotel = await Hotel.findOne({ users: req.user._id });

  if (!hotel) {
    return res.status(403).json({
      status: 'fail',
      message: 'User is not assigned to any hotel'
    });
  }

  // ✅ Inject hotel id
  req.body.hotel = hotel._id;

  next();
};


