const express = require("express");
const {
  getAllWallets,
  getWalletByUserId,
  getAllWalletTransactions,
  adjustWalletBalance
} = require("../../controllers/admin/wallet-controller");
const { authMiddleware, adminMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// Protect all admin wallet routes
router.use(authMiddleware);
router.use(adminMiddleware);

// FIXED: Use only one endpoint for getting all wallets
router.get("/", getAllWallets); // This will be /api/admin/wallets/
router.get("/transactions", getAllWalletTransactions);
router.get("/user/:userId", getWalletByUserId);
router.post("/adjust-balance", adjustWalletBalance);

module.exports = router;