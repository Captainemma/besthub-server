const express = require("express");
const {
  getAllATOrders,
  getAllOrdersForAdmin,
  updateOrderStatus,
  bulkUpdateOrderStatus
} = require("../../controllers/admin/at-orders-controller");

const router = express.Router();

// AirtelTigo Orders management routes
router.get("/", getAllATOrders);
router.get("/all", getAllOrdersForAdmin); // Alternative endpoint
router.patch("/:orderId/status", updateOrderStatus);
router.patch("/bulk-status", bulkUpdateOrderStatus);

module.exports = router;