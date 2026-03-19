const Order = require("../models/Order");
//const Cart = require("../models/Cart"); // Assuming you have a Cart model

// 1. Renders the main Orders Page
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate("items.productId")
            .sort({ createdAt: -1 });

        res.render("orders", { orders, user: req.user });
    } catch (err) {
        res.status(500).send("Internal Server Error");
    }
};

// 2. Status JSON for Polling
exports.getOrderStatus = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ success: false });
        res.json({ success: true, status: order.status });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};