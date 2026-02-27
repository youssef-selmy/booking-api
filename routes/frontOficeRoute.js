const express = require("express");
const router = express.Router();

const frontoffice = require("../controller/front-office");
const recommendationController = require("../controller/recommendationController");
const authController = require("../controller/authController");

// 🔐 protect all routes
router.use(authController.protect);

// 📅 dashboards
router.get("/arrivals", frontoffice.getUpcomingArrivals);
router.get("/departures", frontoffice.getDepartures);
router.get("/inhouse", frontoffice.getInHouse);
router.get("/noshow", frontoffice.getNoShow);

// AI recommendation for front desk
router.post("/recommendation", recommendationController.getRecommendation);
router.post("/manager-recommendation", recommendationController.getManagerRecommendation);

// 🏨 front office actions
router.patch("/:id/check-in", frontoffice.checkIn);
router.patch("/:id/check-out", frontoffice.checkOut);

module.exports = router;
