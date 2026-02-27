const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: "Hotel",
      required: true,
      unique: true, // one settings per hotel
    },
    printTerms: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);