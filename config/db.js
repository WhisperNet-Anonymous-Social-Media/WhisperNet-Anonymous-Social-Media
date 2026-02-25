// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const target = String(process.env.DB_TARGET || "").toLowerCase();
    const dbName =
      target === "beta"
        ? process.env.MONGO_DB_NAME_BETA || process.env.MONGO_DB_NAME
        : target === "test"
        ? process.env.MONGO_DB_NAME_TEST || process.env.MONGO_DB_NAME
        : process.env.MONGO_DB_NAME || undefined;

    const conn = await mongoose.connect(process.env.MONGO_URI, { dbName });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    if (conn.connection.name) {
      console.log(`📦 Using DB: ${conn.connection.name}${target ? ` (target=${target})` : ""}`);
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;   // <-- export the function directly
