const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");

// ================== GET CONVERSATIONS (WITH PREVIEW) ==================
router.get("/conversations/list", authMiddleware, async (req, res) => {
  try {
    const me = req.user.pseudonym;

    // Aggregation Pipeline to get unique chats + last message
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: me }, { recipient: me }]
        }
      },
      {
        $sort: { createdAt: -1 } // Sort by newest first
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", me] }, "$recipient", "$sender"]
          },
          lastMessage: { $first: "$content" },
          timestamp: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$recipient", me] }, { $eq: ["$read", false] }] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          contact: "$_id",
          lastMessage: 1,
          timestamp: 1,
          unreadCount: 1
        }
      },
      { $sort: { timestamp: -1 } }
    ]);

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching conversations" });
  }
});

// ================== DISCOVER SHADOWS (SUGGESTIONS) ==================
router.get("/suggestions", authMiddleware, async (req, res) => {
  try {
    const me = req.user.pseudonym;
    
    // Find users who posted recently (Active Shadows)
    const activePosters = await Post.find().sort({ createdAt: -1 }).limit(50);
    
    // Get unique pseudonyms excluding self
    const suggestions = [...new Set(activePosters.map(p => p.pseudonym))]
      .filter(p => p !== me)
      .slice(0, 10); 

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching suggestions" });
  }
});

// ================== GET CHAT HISTORY ==================
router.get("/:contactPseudonym", authMiddleware, async (req, res) => {
  try {
    const myPseudonym = req.user.pseudonym;
    const contact = req.params.contactPseudonym;

    // Mark as read
    await Message.updateMany(
      { sender: contact, recipient: myPseudonym, read: false },
      { $set: { read: true } }
    );

    const messages = await Message.find({
      $or: [
        { sender: myPseudonym, recipient: contact },
        { sender: contact, recipient: myPseudonym }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// ================== SEND MESSAGE ==================
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { recipient, content } = req.body;
    const sender = req.user.pseudonym;

    const newMessage = new Message({ sender, recipient, content });
    await newMessage.save();

    const io = req.app.get("io");
    
    // Emit to both parties
    io.to(recipient).emit("receive_message", { ...newMessage._doc });
    io.to(sender).emit("receive_message", { ...newMessage._doc });

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: "Error sending message" });
  }
});

module.exports = router;