const express = require("express");
const {
  getAllTelecelOrders,
  getAllOrdersForAdmin,
  updateOrderStatus,
  bulkUpdateOrderStatus
} = require("../../controllers/admin/telecel-orders-controller");

const router = express.Router();

// Telecel Orders management routes
router.get("/", getAllTelecelOrders);
router.get("/all", getAllOrdersForAdmin); // Alternative endpoint
router.patch("/:orderId/status", updateOrderStatus);
router.patch("/bulk-status", bulkUpdateOrderStatus);

module.exports = router;