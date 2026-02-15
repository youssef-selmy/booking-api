const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
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


  
    // pricePerNight: {
    //   type: Number,
    //   required: true,
    //   min: 0
    // },

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
/* 🔥 UNIQUE PER HOTEL */
roomSchema.index(
  { roomNumber: 1, hotel: 1 },
  { unique: true }
);
roomSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.category?.name) ret.category = ret.category.name;
    if (ret.type?.name) ret.type = ret.type.name;
    return ret;
  }
});

roomSchema.pre(/^find/, function (next) {
  this.populate('category', 'name')
      .populate('type', 'name');
  next();
});


module.exports = mongoose.model('Room', roomSchema);
