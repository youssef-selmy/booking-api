const asyncHandler = require('express-async-handler');
const ApiFeatures = require('../utils/apiFeatures');
const ApiError = require('../utils/apiError');
const Room = require('../models/roomModel');

// ============================================
// GET OUT OF SERVICE ROOMS (status = maintenance)
// ============================================
exports.getOutOfServiceRooms = asyncHandler(async (req, res) => {
  // 🔒 Always filter by hotel (multi-tenant safe)
  const filter = {
    status: 'maintenance',
    hotel: req.user.hotel // FIXES your previous undefined hotel issue
  };

  const isAll = req.query.all === 'true';

  let apiFeatures = new ApiFeatures(Room.find(filter), req.query)
    .filter()
    .limitFields()
    .sort();

  let paginationResult;

  if (!isAll) {
    const documentsCounts = await Room.countDocuments(filter);
    apiFeatures = apiFeatures.paginate(documentsCounts);
    paginationResult = apiFeatures.paginationResult;
  }

  const rooms = await apiFeatures.mongooseQuery;

  // 🔥 SAME FORMAT AS handlerFactory (frontend safe)
  res.status(200).json({
    results: rooms.length,
    ...(paginationResult && { paginationResult }),
    data: rooms
  });
});





// ============================================
// GET HOUSE KEEPING ROOMS (status = cleaning)
// ============================================
exports.getHouseKeepingRooms = asyncHandler(async (req, res) => {
  const filter = {
    status: 'cleaning',
    hotel: req.user.hotel
  };

  const isAll = req.query.all === 'true';

  let apiFeatures = new ApiFeatures(Room.find(filter), req.query)
    .filter()
    .limitFields()
    .sort();

  let paginationResult;

  if (!isAll) {
    const documentsCounts = await Room.countDocuments(filter);
    apiFeatures = apiFeatures.paginate(documentsCounts);
    paginationResult = apiFeatures.paginationResult;
  }

  const rooms = await apiFeatures.mongooseQuery;

  res.status(200).json({
    results: rooms.length,
    ...(paginationResult && { paginationResult }),
    data: rooms
  });
});



// ============================================
// FINISH OUT OF SERVICE / CLEANING ROOM
// (set status back to available)
// ============================================
exports.finishRoomStatus = asyncHandler(async (req, res, next) => {
  const room = await Room.findOneAndUpdate(
    {
      _id: req.params.id,
      hotel: req.user.hotel // 🔒 prevent cross-hotel access
    },
    {
      status: 'available'
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!room) {
    return next(new ApiError(`No room found for this id ${req.params.id}`, 404));
  }

  // SAME handlerFactory response style
  res.status(200).json({ data: room });
});


// @desc    Set room to housekeeping by room number
// @route   PATCH /api/v1/rooms/housekeeping/:roomNumber
// @access  Private (Hotel Staff)
exports.setRoomToHousekeeping = asyncHandler(async (req, res, next) => {
  const { roomNumber } = req.params;

  if (!req.user?.hotel) {
    return next(new ApiError('User not assigned to any hotel', 403));
  }

  const room = await Room.findOneAndUpdate(
    {
      roomNumber,
      hotel: req.user.hotel // 🔒 multi-hotel safety
    },
    {
      status: 'cleaning'
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!room) {
    return next(new ApiError(`No room found with number ${roomNumber}`, 404));
  }

  res.status(200).json({ data: room }); // SAME factory format
});



// @desc    Set room to out of service (maintenance) by room number
// @route   PATCH /api/v1/rooms/out-of-service/:roomNumber
// @access  Private (Hotel Staff)
exports.setRoomToOutOfService = asyncHandler(async (req, res, next) => {
  const { roomNumber } = req.params;

  if (!req.user?.hotel) {
    return next(new ApiError('User not assigned to any hotel', 403));
  }

  const room = await Room.findOneAndUpdate(
    {
      roomNumber,
      hotel: req.user.hotel
    },
    {
      status: 'maintenance'
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!room) {
    return next(new ApiError(`No room found with number ${roomNumber}`, 404));
  }

  res.status(200).json({ data: room });
});
