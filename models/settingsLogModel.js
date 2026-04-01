const mongoose = require("mongoose");

const settingsLogSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      default: "settings",
      trim: true,
    },
    details: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SettingsLog", settingsLogSchema);
