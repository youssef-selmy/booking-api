const asyncHandler = require("express-async-handler");
const TravelAgent = require("../models/travelAgentModel");
const factory = require("./handlersFactoryController");
const ApiError = require("../utils/apiError");

// ======================================
// 🔒 Create Travel Agent (Scoped to Hotel)
// ======================================
exports.createTravelAgent = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.hotel) {
    return next(new ApiError("User hotel not found", 401));
  }

  const agent = await TravelAgent.create({
    ...req.body,
    hotel: req.user.hotel // 🔥 Auto attach hotel
  });

  res.status(201).json({
    status: "success",
    data: agent
  });
});

// ======================================
// 📥 Get All Travel Agents (Hotel Only)
// ======================================
exports.getAllTravelAgents = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.hotel) {
    return next(new ApiError("User hotel not found", 401));
  }

  const agents = await TravelAgent.find({
    hotel: req.user.hotel
  }).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: agents.length,
    data: agents
  });
});

// ======================================
// 🔍 Get Single Travel Agent
// (Factory but hotel-safe)
// ======================================
exports.getTravelAgent = asyncHandler(async (req, res, next) => {
  const agent = await TravelAgent.findOne({
    _id: req.params.id,
    hotel: req.user.hotel
  });

  if (!agent) {
    return next(new ApiError("Travel agent not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: agent
  });
});

// ======================================
// ✏️ Update Travel Agent
// ======================================
exports.updateTravelAgent = asyncHandler(async (req, res, next) => {
  const agent = await TravelAgent.findOneAndUpdate(
    {
      _id: req.params.id,
      hotel: req.user.hotel // 🔥 protect other hotels data
    },
    req.body,
    { new: true, runValidators: true }
  );

  if (!agent) {
    return next(new ApiError("Travel agent not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: agent
  });
});

// ======================================
// 🗑️ Delete Travel Agent
// ======================================
exports.deleteTravelAgent = asyncHandler(async (req, res, next) => {
  const agent = await TravelAgent.findOneAndDelete({
    _id: req.params.id,
    hotel: req.user.hotel
  });

  if (!agent) {
    return next(new ApiError("Travel agent not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});
