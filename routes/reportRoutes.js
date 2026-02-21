const express = require("express");
const router = express.Router();
const reportController = require("../controller/reportController");
const protect = require("../controller/authController").protect;

router.use(protect);

router.get("/expected-arrivals", reportController.getExpectedArrivals);
router.get("/in-house", reportController.getInHouseGuests);
router.get("/reservation-ledger", reportController.getReservationLedger);
router.get("/no-show-cancel", reportController.getNoShowAndCancellations);
router.get("/police", reportController.getPoliceReport);
router.get("/room-status", reportController.getRoomStatusReport);
router.get("/night-audit", reportController.getNightAuditReport);
router.get("/manager-flash", reportController.getManagerFlashReport);
router.get("/folio-history", reportController.getFolioHistoryReport);
router.get("/cashier", reportController.getCashierReport);


module.exports = router;
