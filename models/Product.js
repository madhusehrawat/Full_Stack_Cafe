const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    price: { 
        type: Number, 
        required: true 
    },
    category: {
        type: String,
        enum: ["coffee", "drinks", "junk food", "salad", "dessert"],
        required: true
    },
    image: { 
        type: String, 
        required: true 
    },
    // ✅ Added isActive field for deactivation logic
    isActive: { 
        type: Boolean, 
        default: true 
    },
    // ✅ Optional: Added timestamps to track when products are added/updated
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Product", productSchema);