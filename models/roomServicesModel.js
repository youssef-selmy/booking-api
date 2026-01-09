const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Service price is required"],
      min: [0, "Service price must be positive"],
    },
  },
  { timestamps: true }
);

const Services = mongoose.model("Services", serviceSchema);
module.exports = Services;
