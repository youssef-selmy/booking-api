const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomCategory",
      required: true
    },

    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true
    },


    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },

    maxGuests: {
      type: Number,
      required: true,
      min: 1
    },
        MaxChildren: {
      type: Number,
    
    },
          view: {
      type: String,
      required:true,
    
    },


    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'cleaning', 'reserved'],
      default: 'available'
    },

  

    floor: {
      type: Number,
      default: 1
    },

    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel', // reference to Hotel model
      required: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
