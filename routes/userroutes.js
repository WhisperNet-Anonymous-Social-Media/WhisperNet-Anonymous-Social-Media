const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// GET all users
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// SEARCH users by pseudonym
router.get("/users/search", authMiddleware, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const startsWith = new RegExp(`^${escaped}`, "i");
    const contains = new RegExp(escaped, "i");

    const users = await User.aggregate([
      {
        $match: {
          pseudonym: { $exists: true, $ne: "", $regex: contains },
        },
      },
      {
        $addFields: {
          rank: {
            $cond: [{ $regexMatch: { input: "$pseudonym", regex: startsWith } }, 0, 1],
          },
        },
      },
      { $sort: { rank: 1, pseudonym: 1 } },
      { $limit: 20 },
      {
        $project: {
          pseudonym: 1,
          isOnline: 1,
          lastSeen: 1,
        },
      },
    ]);

    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: "Search failed" });
  }
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
