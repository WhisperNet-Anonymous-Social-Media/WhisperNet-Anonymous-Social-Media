const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");

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
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).send("User not found");
    console.log("Provided:", otp, "Stored:", user.otp);

    if (user.otp !== otp) return res.status(400).send("Invalid OTP");
    if (Date.now() > user.otpExpires) return res.status(400).send("OTP expired");

    user.verified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    res.status(500).send("Error verifying OTP: " + error.message);
  }
});

module.exports = router;
