require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  const dbName = process.env.MONGO_DB_NAME;
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) throw new Error("MONGO_URI is missing in .env");
  if (!dbName) throw new Error("MONGO_DB_NAME is required");

  await mongoose.connect(mongoUri, { dbName });
  console.log(`Connected to DB: ${dbName}`);

  await mongoose.connection.db.dropDatabase();
  console.log("Database wiped successfully. Fresh start complete.");

  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("db:fresh failed:", err.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });

