const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, "Username is required"] // This was likely 'name' before
    },
    email: { 
        type: String, 
        required: [true, "Email is required"], 
        unique: true 
    },
    password: { 
        type: String, 
        required: [true, "Password is required"] 
    },
    role: { 
        type: String, 
        enum: ["user", "admin"], 
        default: "user" 
    }
});

module.exports = mongoose.model("User", userSchema);