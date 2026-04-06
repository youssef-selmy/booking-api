const express = require("express");

const authController = require("../controller/authController");
const channelManagementController = require("../controller/channelManagementController");

const router = express.Router();

router.use(authController.protect);

router.get("/providers", channelManagementController.listSupportedProviders);
router
  .route("/connection")
  .get(channelManagementController.getConnection)
  .put(channelManagementController.upsertConnection);

router.post("/sync", channelManagementController.syncReservations);
router.post("/import", channelManagementController.importReservations);

module.exports = router;
