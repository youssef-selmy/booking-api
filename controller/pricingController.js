const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');

const Pricing = require('../models/roomPricingModel');

// @desc    Get list of pricings
// @route   GET /api/v1/pricing
// @access  Private/Admin
exports.getPricings = factory.getAll(Pricing);

// @desc    Get specific pricing by id
// @route   GET /api/v1/pricing/:id
// @access  Private/Admin
exports.getPricing = factory.getOne(Pricing);

// @desc    Create pricing
// @route   POST  /api/v1/pricing
// @access  Private/Admin
exports.createPricing = factory.createOne(Pricing);

// @desc    Update specific pricing
// @route   PUT /api/v1/pricing/:id
// @access  Private/Admin
exports.updatePricing = factory.updateOne(Pricing);

// @desc    Delete specific pricing
// @route   DELETE /api/v1/pricing/:id
// @access  Private/Admin
exports.deletePricing = factory.deleteOne(Pricing);
