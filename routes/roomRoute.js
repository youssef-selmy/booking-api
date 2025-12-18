const express = require("express");
const {
  createRoomValidator,
  getRoomValidator,
  updateRoomValidator,
  deleteRoomValidator,
  
} = require("../utils/validators/roomValidator");

const {
  getRoom,
  getRooms,
  deleteRoom,
  updateRoom,
  createRoom,
} = require("../controller/roomController");
const authController = require("../controller/authController");

const router = express.Router();

router.use(authController.protect);

router.post(
  "/",
  createRoomValidator,
  createRoom
);
router.get("/:id", getRoomValidator, getRoom);
router.get("/", getRooms);
router.put("/:id", updateRoomValidator, updateRoom);
router.delete("/:id", deleteRoomValidator, deleteRoom);


module.exports = router;
