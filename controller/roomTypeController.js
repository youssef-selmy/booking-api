const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');

const roomType = require('../models/roomTypeModel');




// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getAllRoomType = factory.getAll(roomType);

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getRoomType = factory.getOne(roomType);

// @desc    Create user
// @route   POST  /api/v1/users
// @access  Private/Admin
// exports.createHotel = factory.createOne(Hotel);

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateRoomType = factory.updateOne(roomType);

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteRoomType = factory.deleteOne(roomType);


exports.createRoomType = factory.createOne(roomType)



