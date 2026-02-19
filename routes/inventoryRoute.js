const express = require('express');
const router = express.Router();

const inventoryController = require('../controller/inventoryController');
const authController = require('../controller/authController');

// 🔒 VERY IMPORTANT (fixes: Cannot read properties of undefined (reading 'hotel'))
router.use(authController.protect);

// Inventory Tab APIs
router.get('/out-of-service', inventoryController.getOutOfServiceRooms);
router.get('/house-keeping', inventoryController.getHouseKeepingRooms);
router.patch('/finish/:id', inventoryController.finishRoomStatus);

module.exports = router;
