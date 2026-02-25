const express = require("express");
require("dotenv").config();

const router = express.Router();
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const aiGuard = require("../middleware/aiGuard");
const mongoose = require("mongoose");

// ================== UPLOAD ONLY ==================
// Returns Cloudinary URL metadata without creating a post
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const media = {
      type: req.file.mimetype.startsWith("audio")
        ? "audio"
        : req.file.mimetype.startsWith("video")
        ? "video"
        : "image",
      url: req.file.path,
      publicId: req.file.filename,
    };

    return res.status(201).json({ media });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: "Upload failed" });
  }
});

// ================== CREATE POST ==================
router.post("/create", authMiddleware, upload.single("file"), aiGuard, async (req, res) => {
    try {
      const { content, poll } = req.body;
      const safeContent = String(content || "").trim();
      if (!safeContent && !req.file && !poll) return res.status(400).json({ message: "Post cannot be empty" });

      let media = { type: "none" };
      if (req.file) {
        media = {
          type: req.file.mimetype.startsWith("audio")
            ? "audio"
            : req.file.mimetype.startsWith("video")
            ? "video"
            : "image",
          url: req.file.path,
          publicId: req.file.filename,
        };
      }

      let parsedPoll = undefined;
      if (poll) {
        try {
          const pollObj = typeof poll === "string" ? JSON.parse(poll) : poll;
          const validOptions = (pollObj.options || [])
            .map((opt) => String(opt || "").trim())
            .filter(Boolean);

          if (String(pollObj.question || "").trim() && validOptions.length >= 2) {
            parsedPoll = {
              question: String(pollObj.question).trim(),
              options: validOptions.map((text) => ({ text, voters: [] })),
            };
          }
        } catch (_) {}
      }

      const post = new Post({
        pseudonym: req.user.pseudonym,
        content: safeContent,
        media,
        poll: parsedPoll,
      });

      await post.save();
      const io = req.app.get("io");
      if (io) io.emit("new_post", post);

      res.status(201).json({ message: "Post created", post });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
});

// ================== GET FEED ==================
router.get("/feed", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .populate('originalPost'); 
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================== GET BOOKMARKS ==================
// ✅ New Route for Bookmarks Page
router.get("/bookmarks", authMiddleware, async (req, res) => {
    try {
        // Find posts where 'bookmarks' array contains user's pseudonym
        const posts = await Post.find({ bookmarks: req.user.pseudonym })
            .sort({ createdAt: -1 })
            .populate('originalPost');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// ================== LIKE ==================
router.post("/like/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const index = post.likes.indexOf(req.user.pseudonym);
    const isLiking = index === -1;
    if (isLiking) post.likes.push(req.user.pseudonym);
    else post.likes.splice(index, 1);

    await post.save();

    if (isLiking && post.pseudonym !== req.user.pseudonym) {
      await Notification.create({
        recipient: post.pseudonym,
        sender: req.user.pseudonym,
        type: "like",
        postId: post._id,
        message: "liked your whisper.",
      });
      const io = req.app.get("io");
      if (io) io.to(post.pseudonym).emit("notification_new", { type: "like" });
    }

    res.json({ message: "Success", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================== COMMENT ==================
router.post("/comment/:postId", authMiddleware, async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment?.trim()) return res.status(400).json({ message: "Empty comment" });
    
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ pseudonym: req.user.pseudonym, comment });
    await post.save();

    if (post.pseudonym !== req.user.pseudonym) {
      await Notification.create({
        recipient: post.pseudonym,
        sender: req.user.pseudonym,
        type: "comment",
        postId: post._id,
        message: "commented on your whisper.",
      });
      const io = req.app.get("io");
      if (io) io.to(post.pseudonym).emit("notification_new", { type: "comment" });
    }

    res.json({ message: "Comment added", comments: post.comments });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================== POLL VOTE ==================
router.post("/vote/:postId", authMiddleware, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post || !post.poll?.options?.length) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const selected = Number(optionIndex);
    if (Number.isNaN(selected) || selected < 0 || selected >= post.poll.options.length) {
      return res.status(400).json({ message: "Invalid poll option" });
    }

    const user = req.user.pseudonym;
    post.poll.options.forEach((opt, idx) => {
      const existing = opt.voters.indexOf(user);
      if (idx === selected) {
        if (existing === -1) opt.voters.push(user);
      } else if (existing !== -1) {
        opt.voters.splice(existing, 1);
      }
    });

    await post.save();
    return res.json({ message: "Vote recorded", poll: post.poll });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ================== IMPRESSIONS ==================
router.post("/impression/:postId", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const viewer = req.user.pseudonym;
    if (!Array.isArray(post.impressionUsers)) post.impressionUsers = [];

    if (!post.impressionUsers.includes(viewer)) {
      post.impressionUsers.push(viewer);
      post.impressions = (post.impressions || 0) + 1;
      await post.save();
    }

    return res.json({ impressions: post.impressions || 0 });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ================== DELETE POST ==================
router.delete("/:postId", authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Check ownership
        if (post.pseudonym !== req.user.pseudonym) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Post.findByIdAndDelete(req.params.postId);
        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ================== RESHARE (RETWEET) ==================
router.post("/retweet/:postId", authMiddleware, async (req, res) => {
    try {
        const originalPost = await Post.findById(req.params.postId);
        if (!originalPost) return res.status(404).json({ message: "Original post not found" });

        // 1. Add user to 'reshares' array of the ORIGINAL post (for the green icon)
        if (!originalPost.reshares.includes(req.user.pseudonym)) {
            originalPost.reshares.push(req.user.pseudonym);
            await originalPost.save();
        } else {
             // Toggle off? For now let's just create the reshare post.
        }

        // 2. Create the new "Reshare" post
        const retweet = new Post({
            pseudonym: req.user.pseudonym,
            content: "", 
            isRetweet: true,
            originalPost: originalPost._id
        });

        await retweet.save();
        await retweet.populate('originalPost');

        const io = req.app.get("io");
        if (io) io.emit("new_post", retweet);

        res.json({ message: "Reshared successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// ================== BOOKMARK ==================
router.post("/bookmark/:postId", authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const index = post.bookmarks.indexOf(req.user.pseudonym);
        if (index === -1) {
            post.bookmarks.push(req.user.pseudonym);
        } else {
            post.bookmarks.splice(index, 1);
        }
        await post.save();
        res.json({ message: "Bookmark updated" });
    } catch (err) {
        console.error("Bookmark Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ================== REPORT ==================
router.post("/report/:postId", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
            return res.status(400).json({ message: "Invalid post id" });
        }
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });
        if (!Array.isArray(post.reports)) post.reports = [];

        const alreadyReported = post.reports.some(r => r.reporter === req.user.pseudonym);
        if (alreadyReported) return res.status(400).json({ message: "Already reported" });

        post.reports.push({
            reporter: req.user.pseudonym,
            reason: req.body.reason || "General Violation"
        });

        await post.save();
        res.json({ message: "Post reported" });
    } catch (err) {
        console.error("Report Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
