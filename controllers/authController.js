const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.getSignupPage = (req, res) => {
    res.render("signup");
};

exports.getLoginPage = (req, res) => {
    res.render("login");
};

exports.postSignup = async (req, res) => {
    try {
        const { username, email, password } = req.body; 

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, error: "Email already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: 'user' // Default role
        });

        await newUser.save();
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
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

        // 1. Generate Token - Payload must include role for the adminOnly check
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || "supersecretkey",
            { expiresIn: "1d" }
        );

        // 2. Set Cookie - Name MUST be "token" to match your requireAuth middleware
        res.cookie("token", token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax', // Helps with redirecting between routes
            maxAge: 24 * 60 * 60 * 1000 
        });

        // 3. Determine Redirect Path
        // Make sure your DB role is exactly 'admin' (lowercase)
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
    // Clear the specific cookie name
    res.clearCookie("token");
    
    // Logic to handle both AJAX and regular link clicks
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({ success: true, redirectUrl: "/login" });
    }
    res.redirect("/login");
};