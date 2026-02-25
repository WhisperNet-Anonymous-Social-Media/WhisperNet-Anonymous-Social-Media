const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require("./config/db");
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const nodemailer = require('nodemailer');
const postRoutes = require("./routes/postRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const cors = require("cors");
const userRoutes = require("./routes/userroutes");
const http = require("http");
const { Server } = require("socket.io");
const aiRoutes = require("./routes/aiRoutes");
const vibeRoutes = require("./routes/vibeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { generateOTP } = require("./utils/otp");

require('dotenv').config();
const cloudinary = require("cloudinary");
require("./cron/vibeCron");
require("./cron/toxicCleanupCron");

const app = express();
app.use(express.json());

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
  .split(",")
  .map((v) => v.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const corsOriginChecker = (origin, callback) => {
  // Allow non-browser clients (no Origin header)
  if (!origin) return callback(null, true);
  const normalized = String(origin).replace(/\/+$/, "");
  if (corsOrigins.includes(normalized)) return callback(null, true);
  return callback(new Error("Not allowed by CORS"));
};

// Allow frontend to talk to backend
app.use(cors({
    origin: corsOriginChecker,
    credentials: true
}));

// Routes
app.use("/api/ai", aiRoutes);
app.use("/", userRoutes);
app.use("/api/vibe", vibeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

const otpRoutes = require("./routes/otpRoutes");
app.use("/auth", otpRoutes);

// Connect DB
connectDB();

// ================== EMAIL SETUP ==================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.get("/protected", authMiddleware, (req, res) => {
    res.json({ message: `Hello ${req.user.email}, you have access!` });
});

// ================== AUTH ROUTES ==================
app.post('/register', async (req, res) => {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!name || !email || !password) return res.status(400).send('Please fill all fields.');

    try {
        const existingUser = await User.findOne({ email });
        const otp = generateOTP();
        let user;

        if (existingUser) {
            if (existingUser.verified) {
                return res.status(400).send("Email already registered");
            }

            // Allow retry for unverified accounts: reset password + OTP and resend.
            existingUser.name = name;
            existingUser.password = await bcrypt.hash(password, 10);
            existingUser.otp = otp;
            existingUser.otpExpires = Date.now() + 5 * 60 * 1000;
            user = existingUser;
        } else {
            user = new User({
                name,
                email,
                password: await bcrypt.hash(password, 10),
                verified: false,
                otp,
                otpExpires: Date.now() + 5 * 60 * 1000
            });
        }
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your college email (WhisperNet OTP)",
            text: `Your OTP is ${otp}. It is valid for 5 minutes.`
        });

        res.status(201).send("OTP sent to your email.");
    } catch (error) {
        res.status(500).send("Error registering user: " + error.message);
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send("Invalid credentials");
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).send("Invalid credentials");
    if (!user.verified) return res.status(403).send("Please verify your college email first.");
    if (user.isBanned) return res.status(403).send(user.bannedReason || "Account is banned");

    // Update Online Status on Login
    user.isOnline = true;
    await user.save();

    const token = jwt.sign({
        userId: user._id,
        pseudonym: user.pseudonym,
        isAdmin: !!user.isAdmin
    }, process.env.JWT_SECRET || "secret_key", {
        expiresIn: "1d"
    });

    res.status(200).send({ token });
});

app.post("/auth/forgot-password/request", async (req, res) => {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: "If this email exists, a reset OTP has been sent." });
        }

        const otp = generateOTP();
        user.passwordResetOtp = otp;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "WhisperNet password reset OTP",
            text: `Your password reset OTP is ${otp}. It is valid for 10 minutes.`,
        });

        return res.json({ message: "If this email exists, a reset OTP has been sent." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to process request" });
    }
});

app.post("/auth/forgot-password/reset", async (req, res) => {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();
        const otp = String(req.body?.otp || "").trim();
        const newPassword = String(req.body?.newPassword || "");

        if (!email || !otp || newPassword.length < 6) {
            return res.status(400).json({ message: "Email, OTP and a valid new password are required" });
        }

        const user = await User.findOne({ email });
        if (!user || !user.passwordResetOtp || !user.passwordResetExpires) {
            return res.status(400).json({ message: "Invalid reset request" });
        }
        if (user.passwordResetOtp !== otp || user.passwordResetExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetOtp = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return res.json({ message: "Password reset successful" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to reset password" });
    }
});


// ================== POSTS ==================
app.use('/posts', postRoutes);
app.use('/api/posts', postRoutes);

// ================== SOCKET.IO ==================
const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: corsOrigins, methods: ["GET", "POST"] },
    pingInterval: 15000,
    pingTimeout: 60000,
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true
    }
});

io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);
    let connectedPseudonym = null;

    // ✅ Handle Presence
    socket.on("join_chat", async (pseudonym) => {
        if (pseudonym) {
            connectedPseudonym = pseudonym;
            socket.join(pseudonym);
            // Update DB
            await User.findOneAndUpdate({ pseudonym }, { isOnline: true });
            // Broadcast to all clients
            io.emit("user_status", { pseudonym, isOnline: true });
        }
    });

    socket.on("join_room", (roomId) => {
        if (roomId) {
            socket.join(roomId);
            console.log(`🧩 ${socket.id} joined room: ${roomId}`);
        }
    });

    // ================== WEBRTC SIGNAL RELAY ==================
    socket.on("callUser", ({ userToCall, signalData, from, mode }) => {
        if (!userToCall || !signalData || !from) return;
        io.to(userToCall).emit("callUser", {
            signal: signalData,
            from,
            mode
        });
    });

    socket.on("answerCall", ({ to, signal, from }) => {
        if (!to || !signal) return;
        io.to(to).emit("answerCall", {
            signal,
            from
        });
    });

    socket.on("iceCandidate", ({ to, candidate, from }) => {
        if (!to || !candidate) return;
        io.to(to).emit("iceCandidate", {
            candidate,
            from
        });
    });

    socket.on("callDeclined", ({ to, from }) => {
        if (!to) return;
        io.to(to).emit("callDeclined", { from });
    });

    socket.on("endCall", ({ to, from }) => {
        if (!to) return;
        io.to(to).emit("endCall", { from });
    });

    // Handle manual offline (logout)
    socket.on("go_offline", async (pseudonym) => {
        await User.findOneAndUpdate({ pseudonym }, { isOnline: false, lastSeen: new Date() });
        io.emit("user_status", { pseudonym, isOnline: false, lastSeen: new Date() });
    });

    socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);
        if (connectedPseudonym) {
            const lastSeen = new Date();
            User.findOneAndUpdate(
                { pseudonym: connectedPseudonym },
                { isOnline: false, lastSeen }
            ).catch(() => {});
            io.emit("user_status", { pseudonym: connectedPseudonym, isOnline: false, lastSeen });
        }
    });
});

app.set("io", io);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
