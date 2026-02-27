const express = require("express");
const router = express.Router();

const {
  getTerms,
  createTerms,
  updateTerms,
} = require("../controllers/settingsController");

const { protect } = require("../middlewares/authMiddleware");

// All routes require logged user (hotel from token)
router.use(protect);

router
  .route("/terms")
  .get(getTerms)
  .post(createTerms)
  .put(updateTerms);

module.exports = router;