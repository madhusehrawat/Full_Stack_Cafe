const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/", (req, res) => res.redirect("/products"));

// Registration
router.get("/signup", authController.getSignupPage);
router.post("/signup", authController.postSignup);

const { requireAuth } = require("../middleware/authMiddleware");

// Dashboard route - only for admins
// router.get("/dashboard", requireAuth, async (req, res) => {
//     if (req.user.role !== "admin") {
//         return res.redirect("/products"); // Redirect regular users
//     }
//     // Fetch orders or products from your DB here
//     // const orders = await Order.find().populate('user');
//     res.render("adminDashboard", { user: req.user });
// });

// Login
router.get("/login", authController.getLoginPage);
router.post("/login", authController.postLogin);

// Logout (Line 12 - Make sure logout is defined in controller)
router.get("/logout", authController.logout);

module.exports = router;