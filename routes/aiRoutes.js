const express = require("express");
const router = express.Router();
const askGemini = require("../utils/geminiClient");
const authMiddleware = require("../middleware/authMiddleware");

function summarizeLocally(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return "";
    const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length >= 2) {
        return `${sentences[0]} ${sentences[1]}`.trim();
    }
    return clean.slice(0, 220) + (clean.length > 220 ? "..." : "");
}

// POST /api/ai/summarize
router.post("/summarize", authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.length < 50) {
            return res.status(400).json({
                message: "Text too short to summarize"
            });
        }

        const prompt = `
Please provide a concise summary of the following text in exactly 2 short lines:

${text}

Summary:`;

        let summary = "";
        try {
            summary = await askGemini(prompt);
        } catch (gemErr) {
            console.error("Gemini summarize fallback:", gemErr.message);
            summary = summarizeLocally(text);
        }

        if (!summary) {
            summary = summarizeLocally(text);
        }

        res.json({ summary });
    } catch (err) {
        console.error("Summarize Error:", err.message);
        res.status(500).json({ message: "Failed to summarize text", detail: err.message });
    }
});

module.exports = router;
