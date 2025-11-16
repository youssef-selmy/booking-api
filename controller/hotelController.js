const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');

const Hotel = require('../models/hotelModel');

const cloudinary = require('../config/cloudinary');

// Upload helper
const uploadToCloudinary = async (file, folder) => {
  const base64 = file.buffer.toString("base64");
  const dataUri = `data:${file.mimetype};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: folder || "hotel-documents",
    resource_type: "auto",
    type: "upload"
  });

  return result.secure_url;
};

// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getHotels = factory.getAll(Hotel);

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getHotel = factory.getOne(Hotel);

// @desc    Create user
// @route   POST  /api/v1/users
// @access  Private/Admin
// exports.createHotel = factory.createOne(Hotel);

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateHotel = factory.updateOne(Hotel);

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteHotel = factory.deleteOne(Hotel);


exports.createHotel = asyncHandler(async (req, res, next) => {

  let LicensingUrl = null;
  let taxCardUrl = null;
  let CommercialRegisterUrl = null;

  if (req.files?.Licensing) {
    LicensingUrl = await uploadToCloudinary(req.files.Licensing[0], "Licensing");
  }
  if (req.files?.taxCard) {
    taxCardUrl = await uploadToCloudinary(req.files.taxCard[0], "taxCard");
  }
  if (req.files?.CommercialRegister) {
    CommercialRegisterUrl = await uploadToCloudinary(req.files.CommercialRegister[0], "CommercialRegister");
  }

  const hotel = await Hotel.create({
    ...req.body,
    Licensing: LicensingUrl,
    taxCard: taxCardUrl,
    commercialRegister: CommercialRegisterUrl
  });

  res.status(201).json({
    status: "success",
    data: hotel
  });
});



exports.checkSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const hotel = await Hotel.findById(id);

  if (!hotel) {
    return next(new ApiError("Hotel not found", 404));
  }

  res.status(200).json({
    status: "success",
    isActiveSubscription: hotel.isActiveSubscription,
  });
});
