const express = require('express');
const router = express.Router();
const reservationController = require('../controller/reservationController');
const authController = require("../controller/authController");
const reservationValidator = require('../utils/validators/reservationValidator');

// Protect all reservation routes
router.use(authController.protect);

// =============================
// RESERVATION ROUTES
// =============================

// Create reservation
router.post(
    '/',
    reservationValidator.createReservationValidator,
    reservationController.createReservation
);

// Get all reservations
router.get(
    '/',
    reservationController.getReservations
);

// Get a reservation by ID
router.get(
    '/:id',
    reservationValidator.getReservationValidator,
    reservationController.getReservation
);

// Update reservation
router.put(
    '/:id',
    reservationValidator.updateReservationValidator,
    reservationController.updateReservation
);

// Delete reservation
router.delete(
    '/:id',
    reservationValidator.deleteReservationValidator,
    reservationController.deleteReservation
);

module.exports = router;
