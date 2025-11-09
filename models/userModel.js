const mongoose = require('mongoose');

const { Schema } = mongoose;
const bcrypt = require('bcryptjs');
const { number } = require('yargs');

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      trim: true,
      required: [true, 'name required'],
    },
        hotelName: {
      type: String,
      trim: true,
      required: [true, 'HotelName required'],
    },
          location: {
      type: String,
      trim: true,
      required: [true, 'location required'],
    },
              totalRooms: {
      type: Number,
      required: [true, 'totalRooms required'],
    },
                totalOnwers: {
      type: Number,
      required: [true, 'totalOnwers required'],
    },
            services: {
      type: String,
      trim: true,
      required: [true, 'services required'],
    },
              CommercialRegister: {
      type: String,
      
      required: [true, 'CommercialRegister required'],
    },
                  taxCard: {
      type: String,
    
      required: [true, 'taxCard required'],
    },
                  Licensing: {
      type: String,
      
      required: [true, 'Licensing required'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'email required'],
      unique: true,
      lowercase: true,
    },
    phone: String,
    profileImg: String,

    password: {
      type: String,
      required: [true, 'password required'],
      minlength: [6, 'Too short password'],
    },

  
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: [ 'manager', 'admin'],
      default: 'manager',
    },
    active: {
      type: Boolean,
      default: true,
    },

  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
