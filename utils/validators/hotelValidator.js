const { check, body } = require("express-validator");
const mongoose = require("mongoose");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Hotel = require("../../models/hotelModel");

// =============================
// CREATE HOTEL VALIDATOR
// =============================
exports.createHotelValidator = [
  check("hotelName")
    .notEmpty().withMessage("Hotel name is required")
    .isLength({ min: 2 }).withMessage("Hotel name must be at least 2 characters"),

  check("location")
    .notEmpty().withMessage("Location is required"),

  check("phoneNumber")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number (only EG & SA accepted)"),

  check("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),

  check("totalRooms")
    .optional()
    .isInt({ min: 0 }).withMessage("Total rooms must be a positive number"),

  check("totalOwners")
    .optional()
    .isInt({ min: 0 }).withMessage("Total owners must be a positive number"),

  check("commercialRegister").optional(),
  check("taxCard").optional(),
  check("licensing").optional(),
  check("subscriptionCost").optional(),
  check("startAt").optional().isISO8601().withMessage("Invalid start date"),
  check("endAt").optional().isISO8601().withMessage("Invalid end date"),

  check("state").optional(),
  check("services").optional(),

  check("owner")
    .notEmpty().withMessage("Owner is required")
    .isMongoId().withMessage("Invalid owner ID format"),

  validatorMiddleware,
];

// =============================
// GET HOTEL VALIDATOR
// =============================
exports.getHotelValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid hotel ID format"),
  validatorMiddleware,
];

// =============================
// UPDATE HOTEL VALIDATOR
// =============================
exports.updateHotelValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid hotel ID format"),

  body("hotelName")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Hotel name must be at least 2 characters"),

  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format"),

  check("phoneNumber")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number"),

  check("totalRooms")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Total rooms must be a positive number"),

  check("totalOwners")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Total owners must be a positive number"),

  check("startAt").optional().isISO8601().withMessage("Invalid start date"),
  check("endAt").optional().isISO8601().withMessage("Invalid end date"),

  check("owner")
    .optional()
    .isMongoId()
    .withMessage("Invalid owner ID format"),

  validatorMiddleware,
];

// =============================
// DELETE HOTEL VALIDATOR
// =============================
exports.deleteHotelValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid hotel ID format"),
  validatorMiddleware,
];
