const express = require("express");
const router = express.Router();
const askGemini = require("../utils/geminiClient");
const authMiddleware = require("../middleware/authMiddleware");
const Post = require("../models/Post");

const STOPWORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have", "he", "in",
    "is", "it", "its", "of", "on", "or", "that", "the", "to", "was", "were", "will", "with", "we", "our",
    "this", "these", "those", "you", "your", "they", "their", "them", "i", "my", "me"
]);
const PER_MINUTE_LIMIT = 5;
const PER_DAY_LIMIT = 20;
const requestTracker = new Map();

function checkAndTrackQuota(key) {
    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const prev = requestTracker.get(key) || { minuteHits: [], dayHits: [] };
    const minuteHits = prev.minuteHits.filter((t) => t > minuteAgo);
    const dayHits = prev.dayHits.filter((t) => t > dayAgo);

    if (minuteHits.length >= PER_MINUTE_LIMIT) {
        return { ok: false, code: "RATE_LIMIT_PER_MINUTE", retryAfterSeconds: 60 };
    }
    if (dayHits.length >= PER_DAY_LIMIT) {
        return { ok: false, code: "RATE_LIMIT_PER_DAY", retryAfterSeconds: 24 * 60 * 60 };
    }

    minuteHits.push(now);
    dayHits.push(now);
    requestTracker.set(key, { minuteHits, dayHits });
    return { ok: true };
}

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
    const sentences = clean.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    if (sentences.length <= 2) return clean;

    const words = clean.toLowerCase().match(/\b[a-z][a-z0-9'-]*\b/g) || [];
    const freq = new Map();
    for (const word of words) {
        if (STOPWORDS.has(word)) continue;
        freq.set(word, (freq.get(word) || 0) + 1);
    }

    const scored = sentences.map((sentence, idx) => {
        const tokens = sentence.toLowerCase().match(/\b[a-z][a-z0-9'-]*\b/g) || [];
        const score = tokens.reduce((acc, token) => acc + (freq.get(token) || 0), 0);
        return { idx, sentence, score };
    });

    const best = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .sort((a, b) => a.idx - b.idx)
        .map((entry) => entry.sentence);

    return best.join(" ");
}

// POST /api/ai/summarize
router.post("/summarize", authMiddleware, async (req, res) => {
    try {
        const { text, postId } = req.body;
        const allowFallback = String(req.body?.allowFallback ?? req.query?.allowFallback ?? "false").toLowerCase() === "true";

        if (!text || text.length < 50) {
            return res.status(400).json({
                message: "Text too short to summarize"
            });
        }

        let postDoc = null;
        if (postId) {
            postDoc = await Post.findById(postId).select("content aiSummary aiSummarySource");
            if (postDoc && postDoc.aiSummary && String(postDoc.aiSummary).trim()) {
                return res.json({
                    summary: String(postDoc.aiSummary).trim(),
                    source: postDoc.aiSummarySource || "gemini",
                    cached: true,
                });
            }
        }

        const quota = checkAndTrackQuota(req.user?.pseudonym || req.user?.userId || "anonymous");
        if (!quota.ok) {
            return res.status(429).json({
                message: "Summarize rate limit reached for free tier",
                source: "local_fallback",
                code: quota.code,
                retryAfterSeconds: quota.retryAfterSeconds,
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
        let source = "gemini";
        let geminiFailure = null;
        try {
            summary = await askGemini(prompt);
        } catch (gemErr) {
            console.error("Gemini summarize fallback:", gemErr.message);
            source = "local_fallback";
            geminiFailure = {
                code: gemErr?.code || "GEMINI_FAILED",
                status: gemErr?.status || 502,
                details: gemErr?.details || [],
            };
        }

        if (!summary || looksLikeEcho(summary, text) || isLowQualitySummary(summary)) {
            source = "local_fallback";
        }

        if (source === "local_fallback") {
            if (!allowFallback) {
                return res.status(502).json({
                    message: "Gemini did not return a reliable summary",
                    source,
                    geminiFailure,
                });
            }
            summary = summarizeLocally(text);
        }

        const cleanSummary = String(summary || "").trim();
        if (postDoc && cleanSummary) {
            postDoc.aiSummary = cleanSummary;
            postDoc.aiSummarySource = source;
            postDoc.aiSummaryUpdatedAt = new Date();
            await postDoc.save();
        }

        res.json({ summary: cleanSummary, source, cached: false });
    } catch (err) {
        console.error("Summarize Error:", err.message);
        res.status(500).json({ message: "Failed to summarize text", detail: err.message });
    }
});

module.exports = router;
