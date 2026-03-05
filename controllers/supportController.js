// controllers/supportController.js

// GET support page
exports.getSupportPage = (req, res) => {

    res.render("support", {
        user: req.user || null,
        success: false
    });

};


// POST complaint
exports.submitComplaint = (req, res) => {

    const { name, email, product, message } = req.body;

    // Validation
    if (!name || !email || !product || !message) {
        return res.render("support", {
            user: req.user || null,
            success: false,
            error: "All fields required"
        });
    }

    // Save complaint (currently console)
    console.log("New Complaint:");
    console.log({
        name,
        email,
        product,
        message,
        date: new Date()
    });

    res.render("support", {
        user: req.user || null,
        success: true
    });

};