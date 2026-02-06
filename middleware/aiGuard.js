const askGemini = require("../utils/geminiClient");

// Simple local filter (cheap)
const bannedWords = [
    "kill",
    "suicide",
    "rape",
    "die",
    "terrorist",
    "bomb",
    "hate"
];

module.exports = async function aiGuard(req, res, next) {
    try {
        const { content } = req.body;

        if (!content) return next();

        // 1️⃣ Local keyword check (NO AI call)
        const suspicious = bannedWords.some(word =>
            content.toLowerCase().includes(word)
        );

        if (!suspicious) {
            return next(); // safe post
        }

        // 2️⃣ Gemini moderation (AI call ONLY here)
        const prompt = `
You are a content moderation system.
Is the following post toxic, hateful, abusive, or violent?

Reply ONLY with YES or NO.

Post:
"${content}"
`;

        const response = await askGemini(prompt);

        if (response.trim().toUpperCase().includes("YES")) {
            return res.status(403).json({
                message: "Post blocked due to toxic or abusive content"
            });
        }

        next();
    } catch (err) {
        console.error("AI Guard Error:", err.message);
        return res.status(500).json({ message: "AI moderation failed" });
    }
};