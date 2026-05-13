const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const FREE_TIER_MODEL = "gemini-2.5-flash";

async function askGemini(prompt) {
  if (!genAI) {
    const err = new Error("GEMINI_API_KEY is missing");
    err.code = "GEMINI_KEY_MISSING";
    throw err;
  }

  try {
    const model = genAI.getGenerativeModel({ model: FREE_TIER_MODEL });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: String(prompt || "") }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 180,
        topP: 0.9,
      },
    });
    const text = result?.response?.text?.();
    if (!text) throw new Error("Empty Gemini response");
    return text;
  } catch (err) {
    const wrapped = new Error(String(err?.message || "Gemini request failed"));
    wrapped.code = err?.code || "GEMINI_FAILED";
    wrapped.status = err?.status || 502;
    wrapped.details = [
      {
        model: FREE_TIER_MODEL,
        status: err?.status || null,
        message: String(err?.message || "Gemini request failed"),
      },
    ];
    console.error(`Gemini Error (${FREE_TIER_MODEL}):`, wrapped.message);
    throw wrapped;
  }
}

module.exports = askGemini;
