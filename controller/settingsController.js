const asyncHandler = require("express-async-handler");
const Settings = require("../models/settingsModel");
const ApiError = require("../utils/apiError");

// @desc    Get Terms & Conditions (by hotel)
exports.getTerms = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel; // from token

  let settings = await Settings.findOne({ hotel: hotelId });

  // if not exist, return empty (so frontend won't crash)
  if (!settings) {
    return res.status(200).json({
      data: { printTerms: "" },
    });
  }

  res.status(200).json({
    data: settings,
  });
});

// @desc    Create Terms (first time)
exports.createTerms = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const existing = await Settings.findOne({ hotel: hotelId });
  if (existing) {
    return next(new ApiError("Terms already exist for this hotel", 400));
  }

  const settings = await Settings.create({
    hotel: hotelId,
    printTerms: req.body.printTerms || "",
  });

  res.status(201).json({
    data: settings,
  });
});

// @desc    Update Terms (by hotel)
exports.updateTerms = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  let settings = await Settings.findOneAndUpdate(
    { hotel: hotelId },
    { printTerms: req.body.printTerms },
    { new: true, upsert: true } // 🔥 auto create if not exist
  );

  res.status(200).json({
    data: settings,
  });
});