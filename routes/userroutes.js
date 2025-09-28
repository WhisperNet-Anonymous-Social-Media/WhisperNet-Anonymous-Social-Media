const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// GET all users
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// POST create user
router.post("/", async (req, res) => {
  const { name, email } = req.body;
  const user = new User({ name, email });
  await user.save();
  res.status(201).json(user);
});

// GET current logged-in account (protected)
router.get("/account", authMiddleware, async (req, res) => {
  try {
    // ✅ use req.user._id (authMiddleware already attached full user)
    const user = await User.findById(req.user._id).select("-password -otp -otpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});


module.exports = router;
