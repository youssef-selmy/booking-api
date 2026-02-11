const express = require("express");
const router = express.Router();
const frontoffice = require("../controller/front-office");

router.get("/arrivals", frontoffice.getUpcomingArrivals);
router.get("/departures", frontoffice.getDepartures);
router.get("/inhouse", frontoffice.getInHouse);
router.get("/noshow", frontoffice.getNoShow);
module.exports = router;
