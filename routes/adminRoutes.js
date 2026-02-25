const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.use(authMiddleware, adminMiddleware);

router.get("/overview", async (_req, res) => {
  try {
    const [users, posts, reportedPosts, bannedUsers] = await Promise.all([
      User.countDocuments({}),
      Post.countDocuments({}),
      Post.countDocuments({ "reports.0": { $exists: true } }),
      User.countDocuments({ isBanned: true }),
    ]);
    return res.json({ users, posts, reportedPosts, bannedUsers });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load overview" });
  }
});

router.get("/reports", async (_req, res) => {
  try {
    const posts = await Post.find({ "reports.0": { $exists: true } }).sort({ createdAt: -1 });
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load reports" });
  }
});

router.patch("/reports/:postId", async (req, res) => {
  try {
    const { action } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (action === "dismiss") {
      post.reports = [];
      await post.save();
      return res.json({ message: "Report dismissed", post });
    }

    if (action === "delete") {
      await Post.findByIdAndDelete(req.params.postId);
      return res.json({ message: "Post deleted" });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to resolve report" });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const users = await User.find({}, "name email pseudonym isAdmin isBanned verified createdAt")
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.patch("/users/:userId/ban", async (req, res) => {
  try {
    const { isBanned, reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isAdmin) return res.status(400).json({ message: "Cannot ban an admin account" });

    user.isBanned = Boolean(isBanned);
    user.bannedReason = user.isBanned ? String(reason || "Community guidelines violation") : "";
    await user.save();
    return res.json({ message: user.isBanned ? "User banned" : "User unbanned" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update user ban status" });
  }
});

router.patch("/users/:userId/admin", async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isAdmin = Boolean(isAdmin);
    await user.save();
    return res.json({ message: user.isAdmin ? "User promoted to admin" : "Admin revoked" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update admin status" });
  }
});

module.exports = router;

