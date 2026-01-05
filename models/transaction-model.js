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
  paymentReference: String, // ← ADD THIS: For Paystack/MOMO reference
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },
  metadata: Object
}, { timestamps: true });