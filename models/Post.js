const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  pseudonym: { type: String, required: true },
  content: { type: String, required: true },
  likes: [{ type: String }],
  comments: [
    {
      pseudonym: String,
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

// ✅ Export the model, NOT the schema
module.exports = mongoose.model("Post", postSchema);
