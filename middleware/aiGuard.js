const askGemini = require("../utils/geminiClient");

module.exports = async function aiGuard(req, res, next) {
    try {
        const { content } = req.body;

        const text = String(content || "").trim();
        if (!text) return next();

        // Deterministic profanity guard before AI model call.
        const blockedWords = [
          "fuck", "fucked", "fucking", "motherfucker", "bitch", "asshole",
          "bastard", "nigger", "slut", "whore", "cunt", "dickhead",
        ];
        const lowered = ` ${text.toLowerCase()} `;
        const hasBlockedWord = blockedWords.some((w) => {
          const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i");
          return re.test(lowered);
        });
        if (hasBlockedWord) {
          return res.status(403).json({
            message: "Post blocked: explicit or abusive language detected",
          });
        }

        // Strict moderation: run Gemini on every text post
        const prompt = `
You are a content moderation system.
Return strict JSON only:
{"toxic": true|false}

Classify whether the post is toxic, hateful, abusive, violent, explicit abuse, or harassment.
Post:
"${text}"
`;

        const response = await askGemini(prompt);
        const raw = String(response || "").trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        const toxic = parsed?.toxic === true;

        if (toxic) {
            return res.status(403).json({
                message: "Post blocked due to toxic or abusive content"
            });
        }

        next();
    } catch (err) {
        console.error("AI Guard Error:", err.message);
        // Fail-open so service issues do not block normal posting.
        return next();
    }
};
