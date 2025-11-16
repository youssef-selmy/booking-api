const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  
    hotelName: { type: String, required: true },
    location: { type: String, required: true },
    phoneNumber: { type: String },
    email: { type: String, required: true },
    totalRooms: { type: Number, default: 0 },
    totalOwners: { type: Number, default: 0 },
    commercialRegister: { type: String },
    taxCard: { type: String },
    licensing: { type: String },
    subscriptionCost: { type: String ,default:0},
    paid: { type: String ,default:0},
    startAt: { type: Date },
    endAt: { type: Date },
    state: { type: String },
    services: { type: String },
    isActiveSubscription: {type:Boolean ,default:false},
    owner: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}

  
});

const Hotel= mongoose.model("Hotel", HotelSchema);
module.exports = Hotel; 
