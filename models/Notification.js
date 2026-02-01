const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true }, // Pseudonym
  sender: { type: String, required: true },    // Pseudonym
  type: { type: String, enum: ["like", "comment", "system"], required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  message: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);