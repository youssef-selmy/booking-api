const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Packages name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Packages is required"],
      min: [0, "Packages must be positive"],
    },
    hotel: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hotel",
  required: true
}

  },
  { timestamps: true }
);

const Packages = mongoose.model("Packages", PackageSchema);
module.exports = Packages;
