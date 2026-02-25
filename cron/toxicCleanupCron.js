const cron = require("node-cron");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const askGemini = require("../utils/geminiClient");

const isLikelyToxic = async (content) => {
  const prompt = `
You are a strict moderation classifier.
Reply ONLY "YES" or "NO".
Is this content toxic, hateful, abusive, threatening, or harassing?
Content:
"${content}"
`;
  const response = await askGemini(prompt);
  return String(response || "").toUpperCase().includes("YES");
};

// Every 6 hours.
cron.schedule("0 */6 * * *", async () => {
  try {
    const posts = await Post.find({ content: { $exists: true, $ne: "" } })
      .sort({ createdAt: -1 })
      .limit(120);

    for (const post of posts) {
      if (!post.content?.trim()) continue;
      try {
        const toxic = await isLikelyToxic(post.content);
        if (!toxic) continue;

        const owner = post.pseudonym;
        await Post.deleteOne({ _id: post._id });
        await Notification.create({
          recipient: owner,
          sender: "System",
          type: "system",
          message: "One of your whispers was removed for toxic content.",
        });
      } catch (_) {
        // Ignore individual post failures.
      }
    }
  } catch (err) {
    console.error("toxicCleanupCron error:", err.message);
  }
});

