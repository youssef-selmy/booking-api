const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');

const Services = require('../models/roomServicesModel');

// @desc    Get list of services
// @route   GET /api/v1/services
// @access  Private/Admin
exports.getServices = factory.getAll(Services);

// @desc    Get specific service by id
// @route   GET /api/v1/services/:id
// @access  Private/Admin
exports.getService = factory.getOne(Services);

// @desc    Create service
// @route   POST  /api/v1/services
// @access  Private/Admin
exports.createService = factory.createOne(Services);

// @desc    Update specific service
// @route   PUT /api/v1/services/:id
// @access  Private/Admin
exports.updateService = factory.updateOne(Services);

// @desc    Delete specific service
// @route   DELETE /api/v1/services/:id
// @access  Private/Admin
exports.deleteService = factory.deleteOne(Services);
