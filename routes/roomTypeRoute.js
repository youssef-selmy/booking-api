const express = require("express");


const {
  getAllRoomType,
  getRoomType,
  deleteRoomType,
  updateRoomType,
  createRoomType,
} = require("../controller/roomTypeController");
const authController = require("../controller/authController");

const router = express.Router();

router.use(authController.protect);

router.post(
  "/",

  createRoomType
);
router.get("/:id", getRoomType);
router.get("/", getAllRoomType);
router.put("/:id", updateRoomType);
router.delete("/:id", deleteRoomType);


module.exports = router;
