const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');

const Packages = require('../models/roomPackageModel');

// @desc    Get list of packages
// @route   GET /api/v1/packages
// @access  Private/Admin
exports.getPackages = factory.getAll(Packages);

// @desc    Get specific package by id
// @route   GET /api/v1/packages/:id
// @access  Private/Admin
exports.getPackage = factory.getOne(Packages);

// @desc    Create package
// @route   POST  /api/v1/packages
// @access  Private/Admin
exports.createPackage = factory.createOne(Packages);

// @desc    Update specific package
// @route   PUT /api/v1/packages/:id
// @access  Private/Admin
exports.updatePackage = factory.updateOne(Packages);

// @desc    Delete specific package
// @route   DELETE /api/v1/packages/:id
// @access  Private/Admin
exports.deletePackage = factory.deleteOne(Packages);
