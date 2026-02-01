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

require('dotenv').config();
const cloudinary = require("cloudinary");
require("./cron/vibeCron");

const app = express();
app.use(express.json());

// Allow frontend to talk to backend
app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true
}));

// Routes
app.use("/api/ai", aiRoutes);
app.use("/", userRoutes);
app.use("/api/vibe", vibeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

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
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).send('Please fill all fields.');

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send("Email already registered");

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, verified: false });
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your college email",
            text: "Your account has been created. Please verify your email."
        });

        res.status(201).send("User registered. Please check your email to verify.");
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

    // Update Online Status on Login
    user.isOnline = true;
    await user.save();

    const token = jwt.sign({ userId: user._id, pseudonym: user.pseudonym }, process.env.JWT_SECRET || "secret_key", { expiresIn: "1d" });
    res.status(200).send({ token });
});

// ================== POSTS ==================
app.use('/posts', postRoutes);

// ================== SOCKET.IO ==================
const PORT = process.env.PORT || 5001; 
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: ["http://localhost:5173", "null"], methods: ["GET", "POST"] }
});

io.on("connection", (socket) => {
    // console.log("🟢 User connected:", socket.id);

    // ✅ Handle Presence
    socket.on("join_chat", async (pseudonym) => {
        if (pseudonym) {
            socket.join(pseudonym);
            // Update DB
            await User.findOneAndUpdate({ pseudonym }, { isOnline: true });
            // Broadcast to all clients
            io.emit("user_status", { pseudonym, isOnline: true });
        }
    });

    // Handle manual offline (logout)
    socket.on("go_offline", async (pseudonym) => {
        await User.findOneAndUpdate({ pseudonym }, { isOnline: false, lastSeen: new Date() });
        io.emit("user_status", { pseudonym, isOnline: false, lastSeen: new Date() });
    });

    socket.on("disconnect", () => {
        // Note: Mapping socket.id to user for automatic offline is complex without a store (Redis/Map).
        // For this version, 'go_offline' on logout + timeout logic is standard.
    });
});

app.set("io", io);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});