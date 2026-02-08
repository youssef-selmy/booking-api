const mongoose = require("mongoose");

const roomCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    //     price: {
    //   type: Number,
    //   required: [true, "Service price is required"],
    //   min: [0, "Service price must be positive"],
    // }, 


  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomCategory", roomCategorySchema);
