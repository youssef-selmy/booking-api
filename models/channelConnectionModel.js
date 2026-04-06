const mongoose = require("mongoose");

const roomMapSchema = new mongoose.Schema(
  {
    externalRoomId: {
      type: String,
      required: true,
      trim: true
    },
    localRoomNumber: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const channelConnectionSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      unique: true,
      index: true
    },
    provider: {
      type: String,
      enum: [
        "booking.com",
        "opera-cloud",
        "siteminder",
        "cloudbeds",
        "custom"
      ],
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    connectionMode: {
      type: String,
      enum: ["api", "manual", "webhook"],
      default: "api"
    },
    baseUrl: {
      type: String,
      trim: true
    },
    reservationsPath: {
      type: String,
      trim: true,
      default: "/reservations"
    },
    propertyId: {
      type: String,
      trim: true
    },
    authType: {
      type: String,
      enum: ["none", "bearer", "basic", "api-key"],
      default: "bearer"
    },
    credentials: {
      token: String,
      apiKey: String,
      apiKeyHeader: {
        type: String,
        default: "x-api-key"
      },
      username: String,
      password: String
    },
    defaultRate: {
      type: Number,
      default: 0
    },
    requestHeaders: {
      type: Map,
      of: String
    },
    queryTemplate: {
      type: Map,
      of: String
    },
    fieldMap: {
      reservationsPath: String,
      reservationId: String,
      guestFirstName: String,
      guestLastName: String,
      guestEmail: String,
      guestPhone: String,
      checkIn: String,
      checkOut: String,
      roomIds: String,
      roomNumbers: String,
      totalAmount: String,
      paidAmount: String,
      status: String
    },
    roomMap: [roomMapSchema],
    lastSyncAt: Date,
    lastSyncStatus: {
      type: String,
      enum: ["success", "failed"]
    },
    lastSyncMessage: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChannelConnection", channelConnectionSchema);
