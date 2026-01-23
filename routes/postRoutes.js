const express = require("express");
require("dotenv").config();

const router = express.Router();
const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");


// ================== CREATE POST ==================
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { content, media } = req.body;

    const post = new Post({
      pseudonym: req.user.pseudonym, // ✅ from token
      content,
      media: media || { type: "none" },

    });

    await post.save();
    const io = req.app.get("io");
    io.emit("new_post", post);
    res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ================== GET FEED ==================
router.get("/feed", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ================== LIKE / UNLIKE POST ==================
router.post("/like/:postId", authMiddleware, async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Toggle like using pseudonym from token
    const index = post.likes.indexOf(req.user.pseudonym);
    if (index === -1) {
      post.likes.push(req.user.pseudonym);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.json({ message: "Post liked/unliked", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ================== COMMENT ON POST ==================
router.post("/comment/:postId", authMiddleware, async (req, res) => {
  const { comment } = req.body;
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({
      pseudonym: req.user.pseudonym, // ✅ from token
      comment,
    });

    await post.save();
    res.json({ message: "Comment added", comments: post.comments });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ================== UPLOAD MEDIA ==================
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileType = req.file.mimetype.startsWith("audio")
        ? "audio"
        : "image";

      res.status(200).json({
        url: req.file.path,
        publicId: req.file.filename,
        type: fileType,
      });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);


module.exports = router;
