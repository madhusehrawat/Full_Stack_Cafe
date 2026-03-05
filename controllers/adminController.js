const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

/**
 * Helper: Calculates business metrics from order data.
 * Updated to handle case-insensitive status checks.
 */
const calculateStats = (orders) => {
    const totalRevenue = orders
        .filter(order => order.status && order.status.toLowerCase() === 'delivered')
        .reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);

    const activeStatuses = ['pending', 'preparing', 'out for delivery'];
    const activeOrders = orders.filter(o => 
        o.status && activeStatuses.includes(o.status.toLowerCase())
    ).length;

    return {
        totalRevenue: totalRevenue.toLocaleString('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            minimumFractionDigits: 2 
        }),
        orderCount: orders.length,
        activeOrders: activeOrders
    };
};

// 1. Initial Page Render
exports.getAdminDashboard = async (req, res) => {
    try {
        const [orders, products] = await Promise.all([
            Order.find()
                .populate("user", "username email")
                .sort({ createdAt: -1 })
                .lean(),
            Product.find().sort({ name: 1 }).lean()
        ]);

        const stats = calculateStats(orders);

        res.render("adminDashboard", { 
            user: req.user, 
            orders, 
            products, 
            stats 
        });
    } catch (err) {
        console.error("Dashboard Load Error:", err);
        res.status(500).render("error", { message: "Failed to load admin dashboard" });
    }
};

// 2. AJAX Endpoint for Auto-Refresh (Polling)
exports.getDashboardData = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "username email")
            .sort({ createdAt: -1 })
            .lean();

        const stats = calculateStats(orders);

        res.json({ 
            success: true, 
            orders, 
            stats,
            lastUpdated: new Date().toISOString() 
        });
    } catch (err) {
        console.error("Polling Error:", err);
        res.status(500).json({ success: false, message: "Server error during data fetch" });
    }
};

// 3. Update Order Status
// FIXED: Added validation and specific error messaging for permissions/missing data
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        
        if (!orderId || !status) {
            return res.status(400).json({ 
                success: false, 
                message: "Order ID and Status are required." 
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId, 
            { status: status }, 
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.json({ 
            success: true, 
            message: "Status updated successfully", 
            status: updatedOrder.status 
        });
    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error while updating status." 
        });
    }
};

// 4. Toggle Product Availability
exports.toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        product.isActive = !product.isActive; 
        await product.save();
        
        res.json({ 
            success: true, 
            isActive: product.isActive,
            message: `Product is now ${product.isActive ? 'Available' : 'Sold Out'}` 
        });
    } catch (err) {
        console.error("Toggle Product Error:", err);
        res.status(500).json({ success: false, message: "Server error toggling product status" });
    }
};