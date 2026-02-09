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

const Hotel = require('../models/hotelModel');

exports.setHotelIdToBody = async (req, res, next) => {
  // Extra safety: never trust client
  if (req.body.hotel) delete req.body.hotel;

  // 🔎 Find hotel that contains this user
  const hotel = await Hotel.findOne({ users: req.user._id });

  if (!hotel) {
    return res.status(403).json({
      status: 'fail',
      message: 'User is not assigned to any hotel'
    });
  }

  // ✅ Inject hotel id
  req.body.hotel = hotel._id;

  next();
};


