const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

const dbConnection = async () => {
  const conn = await mongoose.connect(process.env.DB_URI);
  console.log(`Database Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = dbConnection;
