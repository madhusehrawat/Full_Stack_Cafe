const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");


// Registration
router.get("/signup", authController.getSignupPage);
router.post("/signup", authController.postSignup);

// Add these to your existing routes
router.get("/verify-otp", (req, res) => res.render("verify-otp"));
router.post("/verify-otp", authController.verifyOTP);
router.post("/resend-otp", authController.resendOTP);

// Login
router.get("/login", authController.getLoginPage);
router.post("/login", authController.postLogin);

// Logout (Line 12 - Make sure logout is defined in controller)
router.get("/logout", authController.logout);

module.exports = router;