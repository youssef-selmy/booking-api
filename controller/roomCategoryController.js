const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');

const roomCategory = require('../models/roomCategoryModel');




// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getAllRoomCategory = factory.getAll(roomCategory);

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getRoomCategory = factory.getOne(roomCategory);

// @desc    Create user
// @route   POST  /api/v1/users
// @access  Private/Admin
// exports.createHotel = factory.createOne(Hotel);

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateRoomCategory = factory.updateOne(roomCategory);

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteRoomCategory = factory.deleteOne(roomCategory);


exports.createRoomCategory = factory.createOne(roomCategory)



