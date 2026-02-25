const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function analyzeVibe(posts) {
    const text = posts.map(p => p.content).join("\n");

    const prompt = `
Analyze the overall emotional vibe of these anonymous college posts.
Return ONLY valid JSON in this format:
{
  "mood": "Happy | Stressed | Angry | Calm | Sad | Excited",
  "emoji": "emoji",
  "confidence": number between 0 and 100,
  "summary": "short sentence"
}

Posts:
${text}
`;

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(prompt);
    const raw = String(result?.response?.text?.() || "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return {
            mood: "Mixed",
            emoji: "🌀",
            confidence: 60,
            summary: "Campus conversations are diverse right now."
        };
    }
    return JSON.parse(jsonMatch[0]);
};
