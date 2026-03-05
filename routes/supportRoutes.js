const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");

// GET: Render the support page
router.get("/", (req, res) => {
    res.render("support", { success: false });
});

// POST: Save the complaint to DB
router.post("/", async (req, res) => {
    try {
        const { name, email, product, message } = req.body;

        const newComplaint = new Feedback({
            name,
            email,
            product,
            message,
            userId: req.user ? req.user._id : null
        });

        await newComplaint.save();
        
        // Return JSON for the Fetch request
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;