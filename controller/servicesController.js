const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Services = require('../models/roomServicesModel');
const { createHotelLog } = require("../utils/hotelLog");

// @desc    Get all services for the hotel
// @route   GET /api/v1/services
// @access  Private/Admin
exports.getServices = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  const services = await Services.find({ hotel: hotelId });

  res.status(200).json({
    results: services.length,
    data: services,
  });
});

// @desc    Get specific service (hotel protected)
// @route   GET /api/v1/services/:id
exports.getService = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const service = await Services.findOne({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!service) {
    return next(new ApiError('Service not found for this hotel', 404));
  }

  res.status(200).json({ data: service });
});

// @desc    Create service for logged-in hotel
// @route   POST /api/v1/services
exports.createService = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!hotelId) {
    return next(new ApiError('User is not linked to any hotel', 400));
  }

  // Never trust client input
  if (req.body.hotel) delete req.body.hotel;

  req.body.hotel = hotelId;

  const service = await Services.create(req.body);

  await createHotelLog({
    hotel: hotelId,
    user: req.user?._id,
    action: "create",
    target: "service",
    details: { serviceId: service._id, name: service.name },
  });

  res.status(201).json({
    success: true,
    data: service,
  });
});

// @desc    Update specific service (hotel protected)
// @route   PUT /api/v1/services/:id
exports.updateService = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const updated = await Services.findOneAndUpdate(
    { _id: req.params.id, hotel: hotelId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updated) {
    return next(new ApiError('Service not found or not authorized', 404));
  }

  await createHotelLog({
    hotel: hotelId,
    user: req.user?._id,
    action: "update",
    target: "service",
    details: { serviceId: updated._id, name: updated.name },
  });

  res.status(200).json({ success: true, data: updated });
});

// @desc    Delete specific service (hotel protected)
// @route   DELETE /api/v1/services/:id
exports.deleteService = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const deleted = await Services.findOneAndDelete({
    _id: req.params.id,
    hotel: hotelId,
  });

  if (!deleted) {
    return next(new ApiError('Service not found or not authorized', 404));
  }

  await createHotelLog({
    hotel: hotelId,
    user: req.user?._id,
    action: "delete",
    target: "service",
    details: { serviceId: deleted._id, name: deleted.name },
  });

  res.status(204).send();
});
