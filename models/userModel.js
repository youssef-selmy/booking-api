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
        hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },

  
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: [ 'front_office','manager', 'admin'],
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
