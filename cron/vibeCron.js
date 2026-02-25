console.log("✅ vibeCron.js file loaded");

const cron = require("node-cron");
const Post = require("../models/Post");
const Vibe = require("../models/Vibe");
const analyzeVibe = require("../services/vibeAnalyzer");

// 🔁 TEMP: run every minute for testing
cron.schedule("0 * * * *", async () => {
    try {
        console.log("🧠 Running vibe analysis...");

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(50);

        if (posts.length === 0) {
            console.log("⚠️ No posts found, skipping vibe");
            return;
        }

        const result = await analyzeVibe(posts);

        await Vibe.create({
            mood: result.mood,
            emoji: result.emoji,
            confidence: result.confidence,
            summary: result.summary,
        });

        console.log("✅ Vibe saved:", result.mood);
    } catch (err) {
        console.error("❌ Vibe cron error:", err.message);
    }
});