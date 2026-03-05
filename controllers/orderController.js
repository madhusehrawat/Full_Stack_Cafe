const Order = require("../models/Order");
const Cart = require("../models/Cart"); // Assuming you have a Cart model

// 1. Logic to Create the Order (The missing link)
exports.confirmOrder = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        const subtotal = cart.items.reduce((acc, item) => acc + (item.productId.price * item.quantity), 0);
        const totalAmount = (subtotal * 1.05).toFixed(2); // Adding 5% GST

        const newOrder = new Order({
            user: req.user._id,
            items: cart.items.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity
            })),
            totalAmount: totalAmount,
            status: "Pending"
        });

        await newOrder.save();
        await Cart.deleteOne({ user: req.user._id }); // Clear cart after order

        res.json({ success: true, message: "Order placed successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Order failed" });
    }
};

// 2. Renders the main Orders Page
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

// 3. Status JSON for Polling
exports.getOrderStatus = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ success: false });
        res.json({ success: true, status: order.status });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};