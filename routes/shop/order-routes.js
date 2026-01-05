const express = require("express");
const { createOrder, getUserOrders } = require("../../controllers/shop/order-controller");

const router = express.Router();

// Create a new order
router.post("/", createOrder);

// Get orders for a specific user
router.get("/user/:userId", getUserOrders);

module.exports = router;