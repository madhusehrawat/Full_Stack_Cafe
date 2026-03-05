const Order = require("../models/Order");

// 1. Just render the empty page shell
exports.getCartPage = async (req, res) => {
    res.render("cart", { user: req.user }); 
};

// 2. Final Checkout: Receive LocalStorage data and save to MongoDB
exports.checkout = async (req, res) => {
    try {
        const { cartItems } = req.body; // Sent via fetch from frontend

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        let subtotal = 0;
        const processedItems = cartItems.map(item => {
            subtotal += item.price * item.quantity;
            return {
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                price: item.price
            };
        });

        // 5% Tax calculation
        const finalTotal = subtotal * 1.05;

        const newOrder = new Order({
            user: req.user._id,
            items: processedItems,
            // parseFloat ensures we save a Number to match your Model schema
            totalAmount: parseFloat(finalTotal.toFixed(2)), 
            // FIXED: Capitalized "Pending" to match your Order Model Enum
            status: "Pending" 
        });

        await newOrder.save();
        
        // Success response
        res.json({ 
            success: true, 
            message: "Order placed successfully!",
            orderId: newOrder._id 
        });

    } catch (err) {
        console.error("Checkout Error:", err);
        // Sending the specific message back helps debugging
        res.status(500).json({ 
            success: false, 
            message: err.message || "Server error during checkout" 
        });
    }
};