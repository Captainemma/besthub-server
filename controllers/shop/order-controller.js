const Order = require("../../models/Order");
const { Wallet } = require("../../models/Wallet"); // Destructure Wallet

const createOrder = async (req, res) => {
  try {
    console.log('🔄 Order creation started:', req.body);
    
    const { packageId, phoneNumber, userId, network, amount, packageName } = req.body;

    // Validate required fields
    if (!packageId || !phoneNumber || !userId || !network || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Check if user has sufficient balance
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet not found"
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    // Deduct from wallet
    wallet.balance -= amount;
    await wallet.save();

    // Create order
    const order = new Order({
      userId,
      packageId,
      phoneNumber,
      network: network.toUpperCase(),
      amount,
      packageName: packageName || `${amount}GB`,
      orderStatus: 'pending',
      transactionId: `TXN_${Date.now()}`
    });

    await order.save();

    console.log('✅ Order created successfully:', order._id);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order._id,
        newBalance: wallet.balance
      }
    });

  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order: " + error.message
    });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error("❌ Get user orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

module.exports = { createOrder, getUserOrders };