// routes/vibeRoutes.js
const express = require("express");
const router = express.Router();
const Vibe = require("../models/Vibe");

router.get("/current", async (req, res) => {
    try {
        let vibe = await Vibe.findOne().sort({ createdAt: -1 });

        // If no vibe exists, return a default placeholder
        if (!vibe) {
            vibe = {
                mood: "Chilling",
                emoji: "☕",
                confidence: 100,
                summary: "The campus is quiet. Be the first to start a conversation!"
            };
        }
        res.json(vibe);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch vibe" });
    }
});

module.exports = router;