const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: "GHS"
  }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  type: {
    type: String,
    enum: ["topup", "purchase", "refund", "withdrawal"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String,
  reference: String,
  paymentReference: String, // ADDED: For storing Paystack reference
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },
  metadata: Object
}, { timestamps: true });

const Wallet = mongoose.model("Wallet", WalletSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = { Wallet, Transaction };