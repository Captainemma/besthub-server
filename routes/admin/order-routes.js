const express = require("express");
const {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  getOrderStats,
} = require("../../controllers/admin/order-controller");
const { authMiddleware, adminMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// Protect all admin order routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", getAllOrders);
router.get("/stats", getOrderStats);
router.get("/:id", getOrderDetails);
router.put("/:id/status", updateOrderStatus);

module.exports = router;