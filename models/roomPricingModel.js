const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Pricing name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be positive"],
    },
  },
  { timestamps: true }
);

const Pricing = mongoose.model("Pricing", pricingSchema);
module.exports = Pricing;
