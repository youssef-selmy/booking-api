const jwt = require('jsonwebtoken');

const createToken = (payload,role,hotel) =>
  jwt.sign({ userId: payload,Role:role ,hotel:hotel}, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

module.exports = createToken;