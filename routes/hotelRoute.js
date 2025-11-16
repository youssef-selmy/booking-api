const express = require("express");
const {
  createHotelValidator,
  getHotelValidator,
  updateHotelValidator,
  deleteHotelValidator,
} = require("../utils/validators/hotelValidator");

const {
  getHotel,
  getHotels,
  deleteHotel,
  updateHotel,
  createHotel,
  checkSubscription,
} = require("../controller/hotelController");
const upload = require("../middlewares/uploadFiles");
const authController = require("../controller/authController");

const router = express.Router();

router.use(authController.protect);

router.post(
  "/",
  upload.fields([
    { name: "Licensing", maxCount: 1 },
    { name: "taxCard", maxCount: 1 },
    { name: "CommercialRegister", maxCount: 1 },
  ]),
  createHotelValidator,
  createHotel
);
router.get("/:id", getHotelValidator, getHotel);
router.get("/", getHotels);
router.put("/:id", updateHotelValidator, updateHotel);
router.delete("/:id", deleteHotelValidator, deleteHotel);
router.get("/:id/subscription-status", checkSubscription);

module.exports = router;
