const { check, body } = require("express-validator");
const mongoose = require("mongoose");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Room = require("../../models/roomModel");

// =============================
// CREATE ROOM VALIDATOR
// =============================
exports.createRoomValidator = [
  check("roomNumber")
    .notEmpty().withMessage("Room number is required")
    .isLength({ min: 1 }).withMessage("Room number is invalid"),

    check("category")
    .notEmpty().withMessage("Room category is required")
    .isMongoId().withMessage("Invalid category ID"),

  check("type")
    .notEmpty().withMessage("Room type is required")
    .isMongoId().withMessage("Invalid type ID"),



  check("pricePerNight")
    .notEmpty().withMessage("Price per night is required")
    .isFloat({ min: 0 })
    .withMessage("Price per night must be a positive number"),

  check("maxGuests")
    .notEmpty().withMessage("Max guests is required")
    .isInt({ min: 1 })
    .withMessage("Max guests must be at least 1"),

  check("status")
    .optional()
    .isIn(["available", "occupied", "maintenance", "cleaning", "reserved"])
    .withMessage("Invalid room status"),

  check("floor")
    .optional()
    .isInt()
    .withMessage("Floor must be a number"),

  check("hotel")
    .notEmpty().withMessage("Hotel ID is required")
    .isMongoId()
    .withMessage("Invalid hotel ID format"),

  validatorMiddleware,
];

// =============================
// GET ROOM VALIDATOR
// =============================
exports.getRoomValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid room ID format"),
  validatorMiddleware,
];

// =============================
// UPDATE ROOM VALIDATOR
// =============================
exports.updateRoomValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid room ID format"),

  body("roomNumber")
    .optional()
    .isLength({ min: 1 })
    .withMessage("Room number is invalid"),

  check("type")
    .optional()
    .isIn(["single", "double", "suite", "deluxe", "family"])
    .withMessage("Invalid room type"),

  // check("bedType")
  //   .optional()
  //   .isIn([
  //     "single",
  //     "double",
  //     "queen",
  //     "king",
  //     "twin",
  //     "sofa-bed",
  //     "bunk-bed",
  //     "mixed"
  //   ])
  //   .withMessage("Invalid bed type"),

  check("pricePerNight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price per night must be a positive number"),

  check("maxGuests")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max guests must be at least 1"),

  check("status")
    .optional()
    .isIn(["available", "occupied", "maintenance", "cleaning", "reserved"])
    .withMessage("Invalid room status"),

  check("floor")
    .optional()
    .isInt()
    .withMessage("Floor must be a number"),

  check("hotel")
    .optional()
    .isMongoId()
    .withMessage("Invalid hotel ID format"),

  validatorMiddleware,
];

// =============================
// DELETE ROOM VALIDATOR
// =============================
exports.deleteRoomValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid room ID format"),
  validatorMiddleware,
];
