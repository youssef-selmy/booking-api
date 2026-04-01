const asyncHandler = require("express-async-handler");
const Settings = require("../models/settingsModel");
const SettingsLog = require("../models/settingsLogModel");
const ApiError = require("../utils/apiError");

const createSettingsLog = async ({ hotel, user, action, target, details }) => {
  try {
    await SettingsLog.create({ hotel, user, action, target, details });
  } catch (error) {
    console.error("settings log create error", error);
  }
};

// @desc    Get Terms & Conditions (by hotel)
exports.getTerms = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  const settings = await Settings.findOne({ hotel: hotelId });

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

  await createSettingsLog({
    hotel: hotelId,
    user: req.user?._id,
    action: "create",
    target: "terms",
    details: "Created print terms and conditions",
  });

  res.status(201).json({
    data: settings,
  });
});

// @desc    Update Terms (by hotel)
exports.updateTerms = asyncHandler(async (req, res) => {
  const hotelId = req.user.hotel;
  const previousSettings = await Settings.findOne({ hotel: hotelId });

  const settings = await Settings.findOneAndUpdate(
    { hotel: hotelId },
    { printTerms: req.body.printTerms },
    { new: true, upsert: true }
  );

  await createSettingsLog({
    hotel: hotelId,
    user: req.user?._id,
    action: previousSettings ? "update" : "create",
    target: "terms",
    details: previousSettings
      ? "Updated print terms and conditions"
      : "Created print terms and conditions",
  });

  res.status(200).json({
    data: settings,
  });
});

// @desc    Get settings logs (by hotel)
exports.getSettingsLogs = asyncHandler(async (req, res) => {
  const hotelId = req.user.hotel;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const total = await SettingsLog.countDocuments({ hotel: hotelId });

  const logs = await SettingsLog.find({ hotel: hotelId })
    .populate("user", "userName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    results: logs.length,
    paginationResult: {
      currentPage: page,
      numberOfPages: Math.ceil(total / limit) || 1,
      limit,
      total,
    },
    data: logs,
  });
});
