const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');

const Room = require('../models/roomModel');




// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getRooms = factory.getAll(Room);

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getRoom = factory.getOne(Room);

// @desc    Create user
// @route   POST  /api/v1/users
// @access  Private/Admin
// exports.createHotel = factory.createOne(Hotel);

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateRoom = factory.updateOne(Room);

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteRoom = factory.deleteOne(Room);


exports.createRoom = factory.createOne(Room)



