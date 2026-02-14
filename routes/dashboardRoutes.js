const express = require("express");
const router = express.Router();
const dashboardController = require("../controller/dashboardController");
const authController = require("../controller/authController");
router.use(authController.protect);

router.get("/overview", dashboardController.getDashboardOverview);

module.exports = router;
