const { Wallet, Transaction } = require("../../models/Wallet");
const User = require("../../models/User");

// Get all wallets with user info
const getAllWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({})
      .populate('userId', 'userName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: wallets
    });
  } catch (error) {
    console.error("Get all wallets error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wallets",
    });
  }
};

// Get wallet by user ID
const getWalletByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const wallet = await Wallet.findOne({ userId })
      .populate('userId', 'userName email phone');

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error("Get wallet by user ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wallet",
    });
  }
};

// Get all wallet transactions
const getAllWalletTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate({
        path: 'walletId',
        populate: {
          path: 'userId',
          select: 'userName email phone'
        }
      })
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error("Get all wallet transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wallet transactions",
    });
  }
};

// Manual wallet adjustment (admin only)
const adjustWalletBalance = async (req, res) => {
  try {
    const { userId, amount, description, type } = req.body;

    if (!userId || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: "User ID, amount, and description are required",
      });
    }

    // Find wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found for this user",
      });
    }

    // Create adjustment transaction
    const transaction = new Transaction({
      walletId: wallet._id,
      type: type || (amount > 0 ? "topup" : "withdrawal"),
      amount: Math.abs(amount),
      description: description,
      reference: `ADJ_${Date.now()}`,
      paymentReference: `admin_adjustment_${Date.now()}`,
      status: "completed",
      metadata: {
        adminAdjustment: true,
        adjustedBy: req.user.id,
        reason: description
      }
    });

    await transaction.save();

    // Update wallet balance
    const newBalance = wallet.balance + amount;
    wallet.balance = newBalance < 0 ? 0 : newBalance; // Prevent negative balance
    await wallet.save();

    res.status(200).json({
      success: true,
      message: "Wallet balance adjusted successfully",
      data: {
        wallet,
        transaction
      }
    });
  } catch (error) {
    console.error("Adjust wallet balance error:", error);
    res.status(500).json({
      success: false,
      message: "Error adjusting wallet balance",
    });
  }
};

module.exports = {
  getAllWallets,
  getWalletByUserId,
  getAllWalletTransactions,
  adjustWalletBalance
};