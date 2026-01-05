const express = require("express");
const {
  getWalletBalance,
  topUpWallet,
  verifyTopUp,
  paystackWebhook, // ADDED: Import webhook handler
  getTransactionHistory
} = require("../../controllers/shop/wallet-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// Public webhook route (Paystack calls this directly)
router.post("/webhook/paystack", paystackWebhook);

// Protect all other wallet routes
router.use(authMiddleware);

router.get("/balance/:userId", getWalletBalance);
router.post("/topup", topUpWallet);
router.post("/verify-topup", verifyTopUp);
router.get("/transactions/:userId", getTransactionHistory);

module.exports = router;