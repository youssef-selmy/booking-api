const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");


// =============================
// CREATE RESERVATION VALIDATOR
// =============================
exports.createReservationValidator = [
  // Main Guest
  body("mainGuest.firstName")
    .notEmpty()
    .withMessage("Main guest first name is required"),

  body("mainGuest.lastName")
    .notEmpty()
    .withMessage("Main guest last name is required"),

  body("mainGuest.age")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Age must be a positive number"),

  // Additional Guests
  body("additionalGuests")
    .optional()
    .isArray()
    .withMessage("Additional guests must be an array"),
  body("additionalGuests.*.firstName")
    .notEmpty()
    .withMessage("Additional guest first name is required"),
  body("additionalGuests.*.lastName")
    .notEmpty()
    .withMessage("Additional guest last name is required"),
  body("additionalGuests.*.age")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Additional guest age must be a positive number"),

  // Rooms
  body("rooms")
    .isArray({ min: 1 })
    .withMessage("At least one room is required"),
  body("rooms.*.room")
    .notEmpty()
    .withMessage("Room ID is required")
    .isMongoId()
    .withMessage("Invalid room ID format"),
  body("rooms.*.perDay")
    .notEmpty()
    .withMessage("Per day price is required")
    .isFloat({ min: 0 })
    .withMessage("Per day price must be positive"),

  // Reservation-level services
  body("services")
    .optional()
    .isArray()
    .withMessage("Services must be an array of IDs"),
  body("services.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid service ID"),

  // Reservation-level packages
  body("packages")
    .optional()
    .isArray()
    .withMessage("Packages must be an array of IDs"),
  body("packages.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid package ID"),

  // Payments
  body("payments")
    .optional()
    .isArray()
    .withMessage("Payments must be an array"),
  body("payments.*.amount")
    .notEmpty()
    .withMessage("Payment amount is required")
    .isFloat({ min: 0 })
    .withMessage("Payment amount must be positive"),
  body("payments.*.method")
    .notEmpty()
    .withMessage("Payment method is required"),

  // Status
  body("status")
    .optional()
    .isIn(["pending", "confirmed", "canceled"])
    .withMessage("Invalid reservation status"),

  validatorMiddleware,
];


// =============================
// GET RESERVATION VALIDATOR
// =============================
exports.getReservationValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid reservation ID format"),
  validatorMiddleware,
];

// =============================
// UPDATE RESERVATION VALIDATOR
// =============================
exports.updateReservationValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid reservation ID format"),

  body("mainGuest.firstName")
    .optional()
    .notEmpty()
    .withMessage("Main guest first name is required"),

  body("mainGuest.lastName")
    .optional()
    .notEmpty()
    .withMessage("Main guest last name is required"),

  body("mainGuest.age")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Age must be a positive number"),

  // Rooms
body("rooms")
  .isArray({ min: 1 })
  .withMessage("At least one room is required"),
body("rooms.*.room")
  .notEmpty()
  .withMessage("Room ID is required")
  .isMongoId()
  .withMessage("Invalid room ID format"),
body("rooms.*.nights")
  .notEmpty()
  .withMessage("Number of nights is required")
  .isInt({ min: 1 })
  .withMessage("Nights must be at least 1"),
body("rooms.*.perDay")
  .notEmpty()
  .withMessage("Per day price is required")
  .isFloat({ min: 0 })
  .withMessage("Per day price must be positive"),

  // Reservation-level services
  body("services")
    .optional()
    .isArray()
    .withMessage("Reservation services must be an array"),
  body("services.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid service ID"),


  // Payments
  body("payments")
    .optional()
    .isArray()
    .withMessage("Payments must be an array"),
  body("payments.*.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Payment amount must be positive"),
  body("payments.*.method")
    .optional()
    .notEmpty()
    .withMessage("Payment method is required"),

  // Status
  check("status")
    .optional()
    .isIn(["pending", "confirmed", "canceled"])
    .withMessage("Invalid reservation status"),

  validatorMiddleware,
];

// =============================
// DELETE RESERVATION VALIDATOR
// =============================
exports.deleteReservationValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid reservation ID format"),
  validatorMiddleware,
];
