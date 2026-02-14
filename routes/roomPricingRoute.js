const express = require("express");
const authController = require("../controller/authController");

const router = express.Router();




const {
  createPricing,
  getPricings,
  getPricing,
  updatePricing,
  deletePricing,
} = require("../controller/pricingController");


router.use(authController.protect);
router
  .route("/")
  .post(createPricing)
  .get(getPricings);

router
  .route("/:id")
  .get(getPricing)
  .put(updatePricing)
  .delete(deletePricing);

module.exports = router;
