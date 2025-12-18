const express = require("express");


const {
  getAllRoomCategory,
  getRoomCategory,
  deleteRoomCategory,
  updateRoomCategory,
  createRoomCategory,
} = require("../controller/roomCategoryController");
const authController = require("../controller/authController");

const router = express.Router();

router.use(authController.protect);

router.post(
  "/",

  createRoomCategory
);
router.get("/:id", getRoomCategory);
router.get("/", getAllRoomCategory);
router.put("/:id", updateRoomCategory);
router.delete("/:id", deleteRoomCategory);


module.exports = router;
