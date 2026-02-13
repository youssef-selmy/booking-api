const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const RoomCategory = require('../models/roomCategoryModel');

// @desc    Get all room categories for specific hotel
// @route   GET /api/v1/room-categories
// @access  Private/Admin (Hotel Scoped)
exports.getAllRoomCategory = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  const categories = await RoomCategory.find({ hotel: hotelId });

  res.status(200).json({
    results: categories.length,
    data: categories,
  });
});

// @desc    Get specific room category (only from same hotel)
exports.getRoomCategory = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const category = await RoomCategory.findOne({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!category) {
    return next(new ApiError('Room category not found for this hotel', 404));
  }

  res.status(200).json({
    data: category,
  });
});

// @desc    Create room category for logged-in hotel
// @route   POST /api/v1/room-categories
// @access  Private/Admin
exports.createRoomCategory = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  // Attach hotel automatically
  req.body.hotel = hotelId;

  const category = await RoomCategory.create(req.body);

  res.status(201).json({
    success: true,
    data: category,
  });
});

// @desc    Update room category (hotel protected)
exports.updateRoomCategory = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const category = await RoomCategory.findOneAndUpdate(
    { _id: req.params.id, hotel: hotelId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!category) {
    return next(new ApiError('Room category not found or not authorized', 404));
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

// @desc    Delete room category (only same hotel)
exports.deleteRoomCategory = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const category = await RoomCategory.findOneAndDelete({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!category) {
    return next(new ApiError('Room category not found or not authorized', 404));
  }

  res.status(204).send();
});
