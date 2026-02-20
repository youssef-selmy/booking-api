const mongoose = require("mongoose");

const travelAgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Travel agent name is required"],
      trim: true
    },

    // 🔥 IMPORTANT: Multi-hotel support
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    }
  },
  { timestamps: true }
);



module.exports = mongoose.model("TravelAgent", travelAgentSchema);
