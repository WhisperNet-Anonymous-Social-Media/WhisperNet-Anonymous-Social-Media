const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const askGemini = async (prompt) => {
    try {
        // Use the standard 'gemini-1.5-flash' which is the current stable alias
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini API Error:", error.message);

        // If the primary model fails, try the 'gemini-1.5-pro' fallback
        if (error.message.includes("404") || error.message.includes("not found")) {
            try {
                console.log("🔄 Retrying with gemini-1.5-pro...");
                const fallback = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
                const result = await fallback.generateContent(prompt);
                return result.response.text();
            } catch (err2) {
                console.error("Fallback failed:", err2.message);
            }
        }

        return "The AI is currently taking a nap. Please try again later.";
    }
};

module.exports = askGemini;