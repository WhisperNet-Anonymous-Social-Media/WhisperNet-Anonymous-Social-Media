const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  verified: { type: Boolean, default: false },
  otp: { type: String },            // <-- add this
  otpExpires: { type: Date }        // <-- and this
});

module.exports = mongoose.model("User", userSchema);
