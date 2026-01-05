const { Wallet, Transaction } = require("../../models/Wallet");
const paystack = require("../../helpers/paystack");

// Get or create wallet for user
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = new Wallet({ userId, balance: 0 });
    await wallet.save();
  }
  return wallet;
};

// Top up wallet
const topUpWallet = async (req, res) => {
  try {
    console.log("Top-up request received:", req.body);
    console.log("User from auth:", req.user);

    const { amount, email } = req.body;
    const userId = req.user.id; // Get userId from authenticated user

    // Basic validation
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Minimum top-up amount is GHS 1"
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Get or create wallet first
    const wallet = await getOrCreateWallet(userId);
    console.log("Wallet found/created:", wallet._id);

    // Generate unique reference for Paystack
    const paystackReference = `wallet_topup_${Date.now()}_${userId}`;

    // Initialize Paystack payment
    const response = await paystack.post("/transaction/initialize", {
      email: email,
      amount: amount,
      reference: paystackReference, // Use our generated reference
      callback_url: "http://localhost:5173/shop/wallet/topup-success",
      metadata: {
        userId: userId,
        type: "wallet_topup",
        walletId: wallet._id.toString()
      }
    });

    const { authorization_url, reference } = response.data.data;

    // Create transaction WITH the walletId and Paystack reference
    const transaction = new Transaction({
      walletId: wallet._id,
      type: "topup",
      amount: amount / 100, // Convert from kobo to GHS
      description: `Wallet Top-up - GHS ${amount / 100}`,
      reference: `TXN_${Date.now()}`, // Internal reference
      paymentReference: paystackReference, // STORE PAYSTACK REFERENCE
      status: "pending",
      metadata: {
        paymentGateway: "paystack",
        topupAmount: amount / 100,
        authorizationUrl: authorization_url,
        userEmail: email
      }
    });

    await transaction.save();
    console.log("Transaction created with Paystack reference:", paystackReference);

    res.status(200).json({
      success: true,
      authorizationURL: authorization_url,
      reference: reference,
      message: "Redirecting to payment gateway..."
    });

  } catch (error) {
    console.error("Wallet top-up error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing wallet top-up: " + error.message
    });
  }
};

// Verify top-up payment
const verifyTopUp = async (req, res) => {
  try {
    const { reference } = req.body;

    // Verify transaction with Paystack
    const response = await paystack.get(`/transaction/verify/${reference}`);
    const paymentData = response.data.data;

    if (paymentData.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment not successful"
      });
    }

    // Find transaction by Paystack reference
    const transaction = await Transaction.findOne({ paymentReference: reference });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    // Update wallet balance
    const wallet = await Wallet.findById(transaction.walletId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    wallet.balance += transaction.amount;
    await wallet.save();

    // Update transaction status and add payment details
    transaction.status = "completed";
    transaction.metadata = {
      ...transaction.metadata,
      paidAt: paymentData.paid_at,
      gatewayResponse: paymentData.gateway_response,
      channel: paymentData.channel,
      ipAddress: paymentData.ip_address
    };
    await transaction.save();

    console.log(`Wallet top-up completed for user ${wallet.userId}, amount: GHS ${transaction.amount}`);

    res.status(200).json({
      success: true,
      message: "Wallet top-up successful",
      data: {
        newBalance: wallet.balance,
        transaction: transaction
      }
    });

  } catch (error) {
    console.error("Verify top-up error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying top-up payment"
    });
  }
};

// Paystack webhook handler
const paystackWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log("Paystack webhook received:", event.event);

    // Verify it's a charge success event
    if (event.event === 'charge.success') {
      const paymentData = event.data;
      const paymentReference = paymentData.reference;

      // Find transaction by Paystack reference
      const transaction = await Transaction.findOne({ 
        paymentReference: paymentReference 
      }).populate('walletId');

      if (transaction && transaction.status === "pending") {
        // Update transaction status
        transaction.status = "completed";
        transaction.metadata = {
          ...transaction.metadata,
          paidAt: paymentData.paid_at,
          gatewayResponse: paymentData.gateway_response,
          channel: paymentData.channel,
          ipAddress: paymentData.ip_address,
          webhookProcessed: true
        };

        // Update wallet balance
        await Wallet.findByIdAndUpdate(
          transaction.walletId._id,
          { $inc: { balance: transaction.amount } }
        );

        await transaction.save();
        console.log(`Webhook: Wallet topup completed for transaction ${transaction._id}, user ${transaction.walletId.userId}`);
      }
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error("Paystack webhook error:", error);
    res.status(500).send('Error processing webhook');
  }
};

// Get wallet balance
const getWalletBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const wallet = await getOrCreateWallet(userId);
    
    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency
      }
    });
  } catch (error) {
    console.error("Get wallet balance error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wallet balance"
    });
  }
};

// Get transaction history
const getTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const wallet = await getOrCreateWallet(userId);
    const transactions = await Transaction.find({ walletId: wallet._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error("Get transaction history error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transaction history"
    });
  }
};

module.exports = {
  getWalletBalance,
  topUpWallet,
  verifyTopUp,
  paystackWebhook, // ADDED: Export the webhook handler
  getTransactionHistory
};