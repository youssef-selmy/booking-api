const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Pricing = require('../models/roomPricingModel');

// @desc    Get list of pricings for specific hotel
// @route   GET /api/v1/pricing
// @access  Private/Admin (Hotel Scoped)
exports.getPricings = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  const pricings = await Pricing.find({ hotel: hotelId });

  res.status(200).json({
    results: pricings.length,
    data: pricings,
  });
});

// @desc    Get specific pricing by id (only for same hotel)
exports.getPricing = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const pricing = await Pricing.findOne({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!pricing) {
    return next(new ApiError('Pricing not found for this hotel', 404));
  }

  res.status(200).json({
    data: pricing,
  });
});

// @desc    Create pricing for specific hotel
// @route   POST /api/v1/pricing
// @access  Private/Admin
exports.createPricing = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  // Automatically attach hotel
  req.body.hotel = hotelId;

  const pricing = await Pricing.create(req.body);

  res.status(201).json({
    success: true,
    data: pricing,
  });
});

// @desc    Update specific pricing (hotel protected)
exports.updatePricing = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const pricing = await Pricing.findOneAndUpdate(
    { _id: req.params.id, hotel: hotelId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!pricing) {
    return next(new ApiError('Pricing not found or not authorized', 404));
  }

  res.status(200).json({
    success: true,
    data: pricing,
  });
});

// @desc    Delete specific pricing (only same hotel)
exports.deletePricing = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const pricing = await Pricing.findOneAndDelete({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!pricing) {
    return next(new ApiError('Pricing not found or not authorized', 404));
  }

  res.status(204).send();
});
