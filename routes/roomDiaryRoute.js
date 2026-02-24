const express = require('express');
const router = express.Router();
const roomDiaryController = require('../controller/roomDiaryController');
const authController = require('../controller/authController');

router.get(
  '/',
  authController.protect, // MUST (adds req.user.hotel)
  roomDiaryController.getRoomDiary
);

module.exports = router;