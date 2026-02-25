require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function run() {
  const dbName = process.env.MONGO_DB_NAME;
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in .env");
  }
  if (!dbName) {
    throw new Error("MONGO_DB_NAME is required for safe fresh reset");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "WhisperNet Admin";
  const adminPseudonym = process.env.ADMIN_PSEUDONYM || "AdminShadow";

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in .env");
  }

  await mongoose.connect(mongoUri, { dbName });
  console.log(`Connected to DB: ${dbName}`);

  await mongoose.connection.db.dropDatabase();
  console.log("Dropped database successfully.");

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: adminName,
    email: adminEmail.toLowerCase().trim(),
    password: hashedPassword,
    pseudonym: adminPseudonym,
    verified: true,
    isAdmin: true,
    isBanned: false,
  });

  console.log(`Admin account created: ${adminEmail}`);
  await mongoose.disconnect();
}

run()
  .then(() => {
    console.log("Fresh DB reset + admin seed complete.");
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("resetAndSeedAdmin failed:", err.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });

