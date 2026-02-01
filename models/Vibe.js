const mongoose = require("mongoose");

const vibeSchema = new mongoose.Schema({
    mood: String,
    emoji: String,
    confidence: Number,
    summary: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Vibe", vibeSchema);