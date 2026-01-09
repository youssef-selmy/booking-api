const express = require("express");

const router = express.Router();

const {
  createPricing,
  getPricings,
  getPricing,
  updatePricing,
  deletePricing,
} = require("../controller/pricingController");

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
