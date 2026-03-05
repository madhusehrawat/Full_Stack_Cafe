const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const cartController = require("../controllers/cartController"); 
const { requireAuth } = require("../middleware/authMiddleware"); // Updated to match your middleware

/**
 * @route   POST /orders/confirm
 * @desc    Convert LocalStorage Cart items into a confirmed Order
 */
router.post("/confirm", requireAuth, cartController.checkout);

/**
 * @route   GET /orders
 * @desc    Get all orders for the logged-in user
 */
router.get("/", requireAuth, orderController.getMyOrders);

/**
 * @route   GET /orders/status/:id
 * @desc    Get status of a specific order
 */
router.get("/status/:id", requireAuth, orderController.getOrderStatus);

module.exports = router;