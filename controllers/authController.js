const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// --- UTILS: OTP Configuration ---
// In a production app, use a dedicated service like SendGrid or AWS SES.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your gmail
        pass: process.env.EMAIL_PASS  // Your gmail App Password
    }
});

// Temporary in-memory store for OTPs. 
// Note: In production, use Redis or a "TempUser" MongoDB collection with TTL.
const otpStore = new Map(); 

exports.getSignupPage = (req, res) => {
    res.render("signup");
};

exports.getLoginPage = (req, res) => {
    const returnTo = req.query.returnTo || "";
    res.render("login", { returnTo });
};

// --- NEW/UPDATED SIGNUP LOGIC ---
exports.postSignup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, error: "Email already registered" });

        // 1. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Hash password now so we don't store it in plain text in the Map
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Store user data + OTP temporarily (expires in 5 mins)
        otpStore.set(email, {
            username,
            password: hashedPassword,
            otp,
            expires: Date.now() + 300000 
        });

        // 4. Send Email
        const mailOptions = {
            from: '"FullStack Cafe" <no-reply@fullstackcafe.com>',
            to: email,
            subject: "Verify Your Email - FullStack Cafe",
            html: `<h3>Welcome to the Cafe!</h3>
                   <p>Your verification code is: <strong>${otp}</strong></p>
                   <p>This code expires in 5 minutes.</p>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        res.status(500).json({ success: false, error: "Error sending OTP email" });
    }
};

// --- NEW: VERIFY OTP AND CREATE USER ---
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const tempData = otpStore.get(email);

        if (!tempData) {
            return res.status(400).json({ success: false, error: "OTP expired or not found. Please signup again." });
        }

        if (tempData.expires < Date.now()) {
            otpStore.delete(email);
            return res.status(400).json({ success: false, error: "OTP expired" });
        }

        if (tempData.otp !== otp) {
            return res.status(400).json({ success: false, error: "Invalid OTP" });
        }

        // OTP is correct! Create the actual user
        const newUser = new User({
            username: tempData.username,
            email: email,
            password: tempData.password,
            role: 'user'
        });

        await newUser.save();
        otpStore.delete(email); // Clean up

        res.status(201).json({ success: true, message: "Account verified successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const tempData = otpStore.get(email);

        if (!tempData) {
            return res.status(400).json({ success: false, error: "Session expired. Please signup again." });
        }

        // Generate new OTP
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Update the store with new OTP and fresh expiry
        tempData.otp = newOtp;
        tempData.expires = Date.now() + 300000; 
        otpStore.set(email, tempData);

        await transporter.sendMail({
            from: '"FullStack Cafe" <no-reply@fullstackcafe.com>',
            to: email,
            subject: "New Verification Code - FullStack Cafe",
            html: `<p>Your new verification code is: <strong>${newOtp}</strong></p>`
        });

        res.json({ success: true, message: "New OTP sent!" });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to resend email" });
    }
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: "Please provide email and password" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || "supersecretkey",
            { expiresIn: "1d" }
        );

        res.cookie("token", token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 
        });

        const destination = user.role === 'admin' ? '/admin/dashboard' : '/products';
        
        return res.status(200).json({ 
            success: true, 
            redirectUrl: destination 
        });

    } catch (err) {
        console.error("SERVER CRASH AT LOGIN:", err);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token");
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({ success: true, redirectUrl: "/login" });
    }
    res.redirect("/login");
};