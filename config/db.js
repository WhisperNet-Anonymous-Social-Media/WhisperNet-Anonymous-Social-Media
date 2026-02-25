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

    // Ensure pseudonym index allows multiple users without pseudonym during OTP flow.
    try {
      const usersCol = mongoose.connection.db.collection("users");
      const indexes = await usersCol.indexes();
      const pseudoIndex = indexes.find((idx) => idx.name === "pseudonym_1");
      const needsRecreate = pseudoIndex && (!pseudoIndex.unique || !pseudoIndex.sparse);

      if (needsRecreate) {
        await usersCol.dropIndex("pseudonym_1");
      }
      if (!pseudoIndex || needsRecreate) {
        await usersCol.createIndex({ pseudonym: 1 }, { unique: true, sparse: true, name: "pseudonym_1" });
      }
    } catch (idxErr) {
      console.warn("⚠️ Could not adjust users.pseudonym index:", idxErr.message);
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;   // <-- export the function directly
