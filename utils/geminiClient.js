const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askGemini(prompt) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview"   // ✅ FIXED MODEL
        });

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.error("Gemini Error:", err.message);
        throw err;
    }
}

module.exports = askGemini;