const express = require("express");
const router = express.Router();

const {
  getTerms,
  createTerms,
  updateTerms,
} = require("../controller/settingsController");

const { protect } = require("../controller/authController");

// All routes require logged user (hotel from token)
router.use(protect);

router
  .route("/terms")
  .get(getTerms)
  .post(createTerms)
  .put(updateTerms);

module.exports = router;