const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require("./config/db");

const mongoose = require('mongoose');
const User = require('./models/User'); 
const Post = require('./models/Post');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());

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

// ================== USER REGISTRATION ==================
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send('Please fill all fields.');
    }

    // Only allow .edu or specific college domain
    const allowedDomain = "college.edu"; // <-- replace with your college domain
    if (!email.endsWith(`@${allowedDomain}`)) {
        return res.status(400).send("Only college email addresses are allowed.");
    }

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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "secret_key", {
        expiresIn: "1d"
    });

    res.status(200).send({ token });
});

// ================== POSTS ==================

// Create a new anonymous post
app.post('/posts', async (req, res) => {
    try {
        const { content, userId } = req.body;

        if (!content || !userId) {
            return res.status(400).send("Missing required fields");
        }

        const post = new Post({
            content,
            user: userId,
            createdAt: new Date()
        });

        await post.save();
        res.status(201).send(post);
    } catch (error) {
        res.status(500).send("Error creating post: " + error.message);
    }
});

// Fetch feed (latest posts)
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.send(posts);
    } catch (error) {
        res.status(500).send("Error fetching posts: " + error.message);
    }
});

// ================== TEST ROUTE ==================
app.get('/test', (req, res) => {
    res.send("Campus Social Media API is working!");
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
