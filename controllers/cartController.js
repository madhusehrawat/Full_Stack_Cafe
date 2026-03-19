const Order = require("../models/Order");

// Renders the cart page shell
exports.getCartPage = async (req, res) => {
    res.render("cart", { user: req.user }); 
};

// Processes the checkout and saves to MongoDB
exports.checkout = async (req, res) => {
    try {
        const { cartItems } = req.body; 

        // 1. Basic Validation
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty." });
        }

        // 2. Process items and calculate subtotal on server-side
        let subtotal = 0;
        const processedItems = cartItems.map(item => {
            const price = parseFloat(item.price);
            const qty = parseInt(item.quantity);
            subtotal += price * qty;
            
            return {
                productId: item.id,
                productName: item.name,
                quantity: qty,
                price: price,
                image: item.image || 'placeholder.png' // Ensure image URL is always present
            };
        });

        // 3. Apply 5% Tax (GST)
        const tax = subtotal * 0.05;
        const totalWithTax = subtotal + tax;

        // 4. Create the Order in MongoDB
        const newOrder = new Order({
            user: req.user._id, // Assumes user is logged in via middleware
            items: processedItems,
            totalAmount: parseFloat(totalWithTax.toFixed(2)),
            status: "Pending" // Matches common Schema Enums
        });

        await newOrder.save();
        
        // 5. Success: Tell frontend to clear LocalStorage
        res.status(201).json({ 
            success: true, 
            message: "Order placed successfully!",
            orderId: newOrder._id 
        });

    } catch (err) {
        console.error("Checkout Logic Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error during order placement." 
        });
    }
};