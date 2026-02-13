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
    hotel: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hotel",
  required: true
}

  },
  { timestamps: true }
);

const Services = mongoose.model("Services", serviceSchema);
module.exports = Services;
