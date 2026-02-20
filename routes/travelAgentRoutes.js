const express = require("express");
const router = express.Router();

const authController = require("../controller/authController");
const travelAgentController = require("../controller/travelAgentController");

// Protect all routes (same as rooms & reservations)
router.use(authController.protect);

router
  .route("/")
  .post(travelAgentController.createTravelAgent)
  .get(travelAgentController.getAllTravelAgents);

router
  .route("/:id")
  .get(travelAgentController.getTravelAgent)
  .patch(travelAgentController.updateTravelAgent)
  .delete(travelAgentController.deleteTravelAgent);

module.exports = router;
