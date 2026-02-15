const express = require("express");
const router = express.Router();

const frontoffice = require("../controller/front-office");
const authController = require("../controller/authController");

// 🔐 protect all routes
router.use(authController.protect);

// 📅 dashboards
router.get("/arrivals", frontoffice.getUpcomingArrivals);
router.get("/departures", frontoffice.getDepartures);
router.get("/inhouse", frontoffice.getInHouse);
router.get("/noshow", frontoffice.getNoShow);

// 🏨 front office actions
router.patch("/reservations/:id/check-in", frontoffice.checkIn);
router.patch("/reservations/:id/check-out", frontoffice.checkOut);

module.exports = router;
