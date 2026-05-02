require('dotenv').config({ override: true });
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'client_rex_stm_2',
    });
    console.log(`MongoDB connected → DB: ${mongoose.connection.db.databaseName}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = connectDB;
