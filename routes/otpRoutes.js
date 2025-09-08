const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { verifyOtp } = require("../controllers/authController");



// Email transporter (using Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Utility function to generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// ================== SEND OTP ==================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 mins expiry
    await user.save();
    console.log("Saved OTP:", otp, "In DB:", user.otp);


    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`
    });

    res.status(200).send("OTP sent successfully!");
  } catch (error) {
    res.status(500).send("Error sending OTP: " + error.message);
  }
});

// ================== VERIFY OTP ==================
router.post("/verify-otp",verifyOtp);

module.exports = router;
