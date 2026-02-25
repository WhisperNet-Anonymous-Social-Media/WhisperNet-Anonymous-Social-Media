const express = require("express");
const router = express.Router();
const askGemini = require("../utils/geminiClient");
const authMiddleware = require("../middleware/authMiddleware");

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
Summarize the following text in 2 short lines (TL;DR):

"${text}"
`;

        const summary = await askGemini(prompt);

        res.json({ summary });
    } catch (err) {
        console.error("Summarize Error:", err.message);
        res.status(500).json({ message: "Failed to summarize text" });
    }
});

module.exports = router;