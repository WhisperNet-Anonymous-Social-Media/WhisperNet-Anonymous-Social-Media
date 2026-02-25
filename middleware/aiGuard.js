const askGemini = require("../utils/geminiClient");

const STRICT_BLOCK_PATTERNS = [
  /\bkill\b/i,
  /\brape\b/i,
  /\bmurder\b/i,
  /\bsuicide\b/i,
  /\bmolest\b/i,
  /\bporn\b/i,
  /\bfuck(?:ed|ing)?\b/i,
  /\bmotherfucker\b/i,
  /\bbitch\b/i,
  /\basshole\b/i,
  /\bbastard\b/i,
  /\bcunt\b/i,
  /\bwhore\b/i,
  /\bslut\b/i,
  /\bnigga\b/i,
  /\bnigger\b/i,
  /\bchutiya\b/i,
  /\bbhenchod\b/i,
  /\bbhenchodd?\b/i,
  /\bmadarchod\b/i,
  /\bmc\b/i,
  /\bbc\b/i,
  /\brandi\b/i,
  /\bgandu\b/i,
  /\bgaand\b/i,
  /\blund\b/i,
  /\bharami\b/i,
  /\bsuar\b/i,
  /\bkutta\b/i,
  /\bkutiya\b/i,
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = async function aiGuard(req, res, next) {
    try {
        const { content } = req.body;

        const text = String(content || "").trim();
        if (!text) return next();

        const normalized = normalizeText(text);
        const hasBlockedWord = STRICT_BLOCK_PATTERNS.some((pattern) => pattern.test(normalized));
        if (hasBlockedWord) {
          return res.status(403).json({
            message: "Post blocked: explicit, hateful, or violent language detected",
          });
        }

        // Strict moderation: run Gemini on every text post
        const prompt = `
You are a content moderation system.
Return strict JSON only:
{"toxic": true|false}

Classify whether the post is toxic, hateful, abusive, violent, sexual abuse, harassment, self-harm encouragement, or severe profanity.
Allow normal non-abusive discussion.
Post:
"${text}"
`;

        let toxic = false;
        try {
          const response = await askGemini(prompt);
          const raw = String(response || "").trim();
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          toxic = parsed?.toxic === true;
        } catch (gemErr) {
          console.error("AI Guard model fallback:", gemErr.message);
          toxic = false;
        }

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
