const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const MODEL_CANDIDATES = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

async function askGemini(prompt) {
  if (!genAI) {
    const err = new Error("GEMINI_API_KEY is missing");
    err.code = "GEMINI_KEY_MISSING";
    throw err;
  }

  let lastError = null;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.();
      if (!text) throw new Error("Empty Gemini response");
      return text;
    } catch (err) {
      lastError = err;
      console.error(`Gemini Error (${modelName}):`, err.message);
    }
  }

  throw lastError || new Error("Gemini request failed");
}

module.exports = askGemini;
