const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Packages = require('../models/roomPackageModel');

// @desc    Get list of packages for specific hotel
// @route   GET /api/v1/packages
// @access  Private (Hotel Owner/Admin)
exports.getPackages = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel; // comes from token/auth middleware

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  const packages = await Packages.find({ hotel: hotelId });

  res.status(200).json({
    results: packages.length,
    data: packages,
  });
});

// @desc    Get specific package by id (for same hotel)
exports.getPackage = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const pkg = await Packages.findOne({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!pkg) {
    return next(new ApiError('Package not found for this hotel', 404));
  }

  res.status(200).json({ data: pkg });
});

// @desc    Create package for specific hotel
exports.createPackage = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  // Attach hotel automatically
  req.body.hotel = hotelId;

  const pkg = await Packages.create(req.body);

  res.status(201).json({
    success: true,
    data: pkg,
  });
});

// @desc    Update specific package (only if belongs to hotel)
exports.updatePackage = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const pkg = await Packages.findOneAndUpdate(
    { _id: req.params.id, hotel: hotelId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!pkg) {
    return next(new ApiError('Package not found or not authorized', 404));
  }

  res.status(200).json({
    success: true,
    data: pkg,
  });
});

// @desc    Delete specific package (only for same hotel)
exports.deletePackage = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const pkg = await Packages.findOneAndDelete({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!pkg) {
    return next(new ApiError('Package not found or not authorized', 404));
  }

  res.status(204).send();
});
