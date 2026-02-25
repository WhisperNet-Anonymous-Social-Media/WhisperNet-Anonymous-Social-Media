const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pseudonym: { type: String, unique: true },
    verified: { type: Boolean, default: false },
    
    // ✅ Added OTP Fields (Critical for Auth)
    otp: { type: String },
    otpExpires: { type: Date },
    passwordResetOtp: { type: String },
    passwordResetExpires: { type: Date },

    // ✅ Presence & Social Features
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    mutedUsers: [{ type: String }] 
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
