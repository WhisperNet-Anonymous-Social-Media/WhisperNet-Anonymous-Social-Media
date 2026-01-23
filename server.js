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

require('dotenv').config();
const cloudinary = require("cloudinary");

const app = express();
app.use(express.json());

// allow frontend to talk to backend
app.use(cors({
    origin: "http://localhost:5173", // your React dev server
    credentials: true
}));

app.use("/", userRoutes);

const otpRoutes = require("./routes/otpRoutes");
app.use("/auth", otpRoutes);

// Connect DB
connectDB();

// ================== EMAIL VERIFICATION SETUP ==================
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

// ================== USER REGISTRATION ==================
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send('Please fill all fields.');
    }

    // ==============================================================
    // 🚧 TEMPORARY CHANGE FOR TESTING: DISABLED .EDU CHECK 🚧
    // Uncomment the lines below before pushing to production!
    // ==============================================================
    /*
    const allowedDomain = "s.amity.edu"; 
    if (!email.endsWith(`@${allowedDomain}`)) {
        return res.status(400).send("Only college email addresses are allowed.");
    }
    */
    // ==============================================================

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send("Email already registered");

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            verified: false // email verification pending
        });

        await user.save();

        // send verification email
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

// ================== LOGIN ==================
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).send("Invalid credentials");

    if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).send("Invalid credentials");
    }

    if (!user.verified) {
        return res.status(403).send("Please verify your college email first.");
    }

    // Added pseudonym to token payload so Frontend AuthContext can read it immediately
    const token = jwt.sign({ 
        userId: user._id,
        pseudonym: user.pseudonym 
    }, process.env.JWT_SECRET || "secret_key", {
        expiresIn: "1d"
    });

    res.status(200).send({ token });
});

// ================== POSTS ==================

// Fetch feed (latest posts)
app.use('/posts', postRoutes);

// ================== TEST ROUTE ==================
app.get('/test', (req, res) => {
    res.send("Campus Social Media API is working!");
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "null"],
        methods: ["GET", "POST"]
    }
});
io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);
    });
});

// 3️⃣ Make io available to routes
app.set("io", io);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});