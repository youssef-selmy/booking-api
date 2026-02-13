const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const RoomType = require('../models/roomTypeModel');

// @desc    Get all room types for specific hotel
// @route   GET /api/v1/room-types
// @access  Private/Admin
exports.getAllRoomType = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  const roomTypes = await RoomType.find({ hotel: hotelId });

  res.status(200).json({
    results: roomTypes.length,
    data: roomTypes,
  });
});

// @desc    Get specific room type (hotel protected)
exports.getRoomType = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const roomType = await RoomType.findOne({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!roomType) {
    return next(new ApiError('Room type not found for this hotel', 404));
  }

  res.status(200).json({
    data: roomType,
  });
});

// @desc    Create room type for logged-in hotel
// @route   POST /api/v1/room-types
// @access  Private/Admin
exports.createRoomType = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  // Never trust client input
  if (req.body.hotel) delete req.body.hotel;

  // Attach hotel automatically
  req.body.hotel = hotelId;

  const newRoomType = await RoomType.create(req.body);

  res.status(201).json({
    success: true,
    data: newRoomType,
  });
});

// @desc    Update room type (only same hotel)
exports.updateRoomType = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const updated = await RoomType.findOneAndUpdate(
    { _id: req.params.id, hotel: hotelId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updated) {
    return next(new ApiError('Room type not found or not authorized', 404));
  }

  res.status(200).json({
    success: true,
    data: updated,
  });
});

// @desc    Delete room type (hotel protected)
exports.deleteRoomType = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const deleted = await RoomType.findOneAndDelete({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!deleted) {
    return next(new ApiError('Room type not found or not authorized', 404));
  }

  res.status(204).send();
});
