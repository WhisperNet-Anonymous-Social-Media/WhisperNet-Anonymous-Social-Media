const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  pseudonym: { type: String, required: true },
  media: {
    url: { type: String },
    type: {
      type: String,
      enum: ["image", "audio", "video", "none"],
      default: "none",
    },
    publicId: { type: String },
  },
  poll: {
    question: { type: String },
    options: [
      {
        text: { type: String },
        voters: [{ type: String }],
      },
    ],
  },
  content: { type: String }, 
  likes: [{ type: String }],
  comments: [
    {
      pseudonym: String,
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  // ✅ Tracks WHO reshared this post (so the button stays green)
  reshares: [{ type: String }], 
  
  // ✅ Tracks if this post ITSELF is a reshare
  isRetweet: { type: Boolean, default: false },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, 
  
  reports: [
    {
       reporter: String,
       reason: String,
       createdAt: { type: Date, default: Date.now }
    }
  ],
  // ✅ Bookmarks field
  bookmarks: [{ type: String }], 
  impressions: { type: Number, default: 0 },
  impressionUsers: [{ type: String }],
  aiSummary: { type: String, default: "" },
  aiSummarySource: { type: String, enum: ["gemini", "local_fallback"], default: "gemini" },
  aiSummaryUpdatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

postSchema.index({ pseudonym: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
