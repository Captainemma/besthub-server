const express = require("express");
const {
  getAllTransactions,
  getTransactionStats
} = require("../../controllers/admin/transactions-controller");
const { authMiddleware, adminMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// Protect all admin transaction routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", getAllTransactions);
router.get("/stats", getTransactionStats);

module.exports = router;