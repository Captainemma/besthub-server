const express = require("express");
const {
  getAllMTNOrders,
  getAllOrdersForAdmin,
  updateOrderStatus,
  bulkUpdateOrderStatus
} = require("../../controllers/admin/mtn-orders-controller");

const router = express.Router();

// MTN Orders management routes
router.get("/", getAllMTNOrders);
router.get("/all", getAllOrdersForAdmin); // Alternative endpoint
router.patch("/:orderId/status", updateOrderStatus);
router.patch("/bulk-status", bulkUpdateOrderStatus);

module.exports = router;