const express = require("express");
const router = express.Router();
const askGemini = require("../utils/geminiClient");
const authMiddleware = require("../middleware/authMiddleware");

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[^\w\s]/g, "")
        .trim();
}

function looksLikeEcho(summary, originalText) {
    const summaryNorm = normalizeText(summary);
    const originalNorm = normalizeText(originalText);
    if (!summaryNorm || !originalNorm) return false;

    if (originalNorm.includes(summaryNorm)) return true;

    const summaryWords = summaryNorm.split(" ").filter(Boolean);
    if (summaryWords.length < 12) return false;

    const preview = summaryWords.slice(0, Math.min(18, summaryWords.length)).join(" ");
    return originalNorm.startsWith(preview);
}

function isLowQualitySummary(summary) {
    const clean = String(summary || "").replace(/\s+/g, " ").trim();
    if (!clean) return true;
    const words = clean.split(" ").filter(Boolean);
    if (words.length < 12) return true;
    if (!/[.!?]$/.test(clean) && words.length < 20) return true;
    if (/:$/.test(clean)) return true;
    return false;
}

function summarizeLocally(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return "";
    const words = clean.split(" ").filter(Boolean);
    const head = words.slice(0, 22).join(" ");
    const middleStart = Math.max(0, Math.floor(words.length / 2) - 11);
    const middle = words.slice(middleStart, middleStart + 22).join(" ");
    const tail = words.slice(Math.max(0, words.length - 14)).join(" ");
    return `TL;DR: ${head}${middle ? ` - ${middle}` : ""}${tail ? ` - ${tail}` : ""}`.trim();
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

        const prompt = [
            "You are a concise summarizer.",
            "Task: create a 2-line TL;DR of the provided post.",
            "Rules:",
            "- Do NOT quote, repeat, or copy full sentences from the post.",
            "- Use fresh wording and preserve only the key meaning.",
            "- Write 2 complete lines, around 30-60 words total.",
            "- Return plain text only.",
            "",
            "POST:",
            text,
        ].join("\n");

        let summary = "";
        try {
            summary = await askGemini(prompt);
            if (looksLikeEcho(summary, text) || isLowQualitySummary(summary)) {
                const retryPrompt = [
                    "Rewrite into a meaningful TL;DR with complete thoughts.",
                    "Do not copy any sentence from input.",
                    "Output exactly 2 lines and 30-60 words total.",
                    "Focus on core idea, challenge, and takeaway.",
                    "",
                    "INPUT:",
                    text,
                ].join("\n");
                summary = await askGemini(retryPrompt);
            }
        } catch (gemErr) {
            console.error("Gemini summarize fallback:", gemErr.message);
            summary = summarizeLocally(text);
        }

        if (!summary || looksLikeEcho(summary, text) || isLowQualitySummary(summary)) {
            summary = summarizeLocally(text);
        }

        res.json({ summary: String(summary || "").trim() });
    } catch (err) {
        console.error("Summarize Error:", err.message);
        res.status(500).json({ message: "Failed to summarize text", detail: err.message });
    }
});

module.exports = router;
