const Order = require("../../models/Order");
const { Transaction } = require("../../models/Wallet");
const User = require("../../models/User");

// Get all transactions (both orders and wallet transactions)
const getAllTransactions = async (req, res) => {
  try {
    // Get orders (data purchases) with user population
    const orders = await Order.find({})
      .populate('userId', 'userName email phone')
      .sort({ orderDate: -1 })
      .limit(100);

    // Get wallet transactions with user population
    const walletTransactions = await Transaction.find({})
      .populate({
        path: 'walletId',
        populate: {
          path: 'userId',
          select: 'userName email phone'
        }
      })
      .sort({ createdAt: -1 })
      .limit(100);

    // Format orders with proper user data
    const formattedOrders = orders.map(order => ({
      id: order._id,
      collection: 'orders',
      type: 'data_purchase',
      userId: order.userId?._id,
      userName: order.userId?.userName || order.userName || 'Unknown User',
      userEmail: order.userId?.email || '',
      userPhone: order.userId?.phone || '',
      network: order.network,
      amount: order.price || order.amount || 0,
      description: order.packageName || `${order.dataAmount || ''} ${order.network} Data`.trim(),
      recipientPhone: order.recipientPhone || order.phoneNumber || 'N/A',
      date: order.orderDate || order.createdAt,
      status: order.orderStatus || 'completed',
      reference: order.reference || order.transactionId || order._id.toString(),
      paymentReference: order.paymentReference || '', // For order payment references
      paymentStatus: order.paymentStatus
    }));

    // Format wallet transactions with proper user data
    const formattedWalletTransactions = walletTransactions.map(transaction => ({
      id: transaction._id,
      collection: 'transactions',
      type: transaction.type,
      userId: transaction.walletId?.userId?._id,
      userName: transaction.walletId?.userId?.userName || 'Unknown User',
      userEmail: transaction.walletId?.userId?.email || '',
      userPhone: transaction.walletId?.userId?.phone || '',
      network: 'System',
      amount: transaction.amount,
      description: transaction.description || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`,
      recipientPhone: 'N/A',
      date: transaction.createdAt,
      status: transaction.status,
      reference: transaction.reference || transaction._id.toString(),
      paymentReference: transaction.paymentReference || '', // Paystack reference for wallet topups
      paymentStatus: transaction.status === 'completed' ? 'success' : 'pending'
    }));

    // Combine all transactions and sort by date (newest first)
    const allTransactions = [...formattedOrders, ...formattedWalletTransactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 100);

    res.status(200).json({
      success: true,
      data: allTransactions,
      totalTransactions: allTransactions.length
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
    });
  }
};

// Get transaction statistics
const getTransactionStats = async (req, res) => {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total completed orders revenue
    const totalRevenueData = await Order.aggregate([
      {
        $match: {
          orderStatus: "completed"
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" }
        }
      }
    ]);

    // Today's completed orders revenue
    const todayRevenueData = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: today },
          orderStatus: "completed"
        }
      },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: "$price" }
        }
      }
    ]);

    // Total wallet topups (completed)
    const totalWalletTopupsData = await Transaction.aggregate([
      {
        $match: {
          type: "topup",
          status: "completed"
        }
      },
      {
        $group: {
          _id: null,
          totalTopups: { $sum: "$amount" }
        }
      }
    ]);

    // Today's wallet topups (completed)
    const todayWalletTopupsData = await Transaction.aggregate([
      {
        $match: {
          type: "topup",
          status: "completed",
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          todayTopups: { $sum: "$amount" }
        }
      }
    ]);

    // Total transactions count
    const totalOrders = await Order.countDocuments();
    const totalWalletTransactions = await Transaction.countDocuments();
    const totalTransactions = totalOrders + totalWalletTransactions;

    // Today's transactions count
    const todayOrders = await Order.countDocuments({
      orderDate: { $gte: today }
    });
    const todayWalletTransactions = await Transaction.countDocuments({
      createdAt: { $gte: today }
    });
    const todayTransactions = todayOrders + todayWalletTransactions;

    // Calculate total revenue (orders revenue + wallet topups)
    const totalOrdersRevenue = totalRevenueData[0]?.totalRevenue || 0;
    const totalTopupsAmount = totalWalletTopupsData[0]?.totalTopups || 0;
    
    // Calculate today's revenue (today orders revenue + today wallet topups)
    const todayOrdersRevenue = todayRevenueData[0]?.todayRevenue || 0;
    const todayTopupsAmount = todayWalletTopupsData[0]?.todayTopups || 0;

    res.status(200).json({
      success: true,
      data: {
        totalTransactions,
        totalRevenue: totalOrdersRevenue + totalTopupsAmount,
        todayTransactions,
        todayRevenue: todayOrdersRevenue + todayTopupsAmount,
        breakdown: {
          totalOrders,
          totalWalletTransactions,
          totalOrdersRevenue,
          totalTopupsAmount,
          todayOrders,
          todayWalletTransactions,
          todayOrdersRevenue,
          todayTopupsAmount
        }
      }
    });
  } catch (error) {
    console.error("Get transaction stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transaction statistics",
    });
  }
};

// Get transactions by user ID
const getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's orders
    const userOrders = await Order.find({ userId })
      .sort({ orderDate: -1 })
      .limit(50);

    // Get user's wallet transactions
    const userWallet = await Wallet.findOne({ userId });
    let userWalletTransactions = [];
    
    if (userWallet) {
      userWalletTransactions = await Transaction.find({ walletId: userWallet._id })
        .sort({ createdAt: -1 })
        .limit(50);
    }

    // Format orders
    const formattedOrders = userOrders.map(order => ({
      id: order._id,
      collection: 'orders',
      type: 'data_purchase',
      network: order.network,
      amount: order.price || order.amount || 0,
      description: order.packageName || `${order.dataAmount || ''} ${order.network} Data`.trim(),
      recipientPhone: order.recipientPhone || order.phoneNumber || 'N/A',
      date: order.orderDate || order.createdAt,
      status: order.orderStatus || 'completed',
      reference: order.reference || order.transactionId || order._id.toString(),
      paymentReference: order.paymentReference || '',
      paymentStatus: order.paymentStatus
    }));

    // Format wallet transactions
    const formattedWalletTransactions = userWalletTransactions.map(transaction => ({
      id: transaction._id,
      collection: 'transactions',
      type: transaction.type,
      network: 'System',
      amount: transaction.amount,
      description: transaction.description || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`,
      recipientPhone: 'N/A',
      date: transaction.createdAt,
      status: transaction.status,
      reference: transaction.reference || transaction._id.toString(),
      paymentReference: transaction.paymentReference || '', // Paystack reference
      paymentStatus: transaction.status === 'completed' ? 'success' : 'pending'
    }));

    // Combine and sort all user transactions
    const allUserTransactions = [...formattedOrders, ...formattedWalletTransactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          userName: user.userName,
          email: user.email,
          phone: user.phone
        },
        transactions: allUserTransactions,
        summary: {
          totalOrders: userOrders.length,
          totalWalletTransactions: userWalletTransactions.length,
          totalTransactions: allUserTransactions.length
        }
      }
    });
  } catch (error) {
    console.error("Get user transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user transactions",
    });
  }
};

// Search transactions
const searchTransactions = async (req, res) => {
  try {
    const { query, type, status, startDate, endDate } = req.query;

    // Build search conditions
    const searchConditions = {};

    if (query) {
      searchConditions.$or = [
        { reference: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'userId.userName': { $regex: query, $options: 'i' } },
        { 'userId.email': { $regex: query, $options: 'i' } },
        { recipientPhone: { $regex: query, $options: 'i' } }
      ];
    }

    if (type && type !== 'all') {
      searchConditions.type = type;
    }

    if (status && status !== 'all') {
      searchConditions.status = status;
    }

    if (startDate || endDate) {
      searchConditions.$and = [];
      if (startDate) {
        searchConditions.$and.push({
          $or: [
            { orderDate: { $gte: new Date(startDate) } },
            { createdAt: { $gte: new Date(startDate) } }
          ]
        });
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        searchConditions.$and.push({
          $or: [
            { orderDate: { $lte: endDateObj } },
            { createdAt: { $lte: endDateObj } }
          ]
        });
      }
    }

    // Search orders
    const orders = await Order.find(searchConditions)
      .populate('userId', 'userName email phone')
      .sort({ orderDate: -1 })
      .limit(50);

    // Search wallet transactions
    const walletTransactions = await Transaction.find(searchConditions)
      .populate({
        path: 'walletId',
        populate: {
          path: 'userId',
          select: 'userName email phone'
        }
      })
      .sort({ createdAt: -1 })
      .limit(50);

    // Format results
    const formattedOrders = orders.map(order => ({
      id: order._id,
      collection: 'orders',
      type: 'data_purchase',
      userId: order.userId?._id,
      userName: order.userId?.userName || order.userName || 'Unknown User',
      userEmail: order.userId?.email || '',
      userPhone: order.userId?.phone || '',
      network: order.network,
      amount: order.price || order.amount || 0,
      description: order.packageName || `${order.dataAmount || ''} ${order.network} Data`.trim(),
      recipientPhone: order.recipientPhone || order.phoneNumber || 'N/A',
      date: order.orderDate || order.createdAt,
      status: order.orderStatus || 'completed',
      reference: order.reference || order.transactionId || order._id.toString(),
      paymentReference: order.paymentReference || '',
      paymentStatus: order.paymentStatus
    }));

    const formattedWalletTransactions = walletTransactions.map(transaction => ({
      id: transaction._id,
      collection: 'transactions',
      type: transaction.type,
      userId: transaction.walletId?.userId?._id,
      userName: transaction.walletId?.userId?.userName || 'Unknown User',
      userEmail: transaction.walletId?.userId?.email || '',
      userPhone: transaction.walletId?.userId?.phone || '',
      network: 'System',
      amount: transaction.amount,
      description: transaction.description || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`,
      recipientPhone: 'N/A',
      date: transaction.createdAt,
      status: transaction.status,
      reference: transaction.reference || transaction._id.toString(),
      paymentReference: transaction.paymentReference || '',
      paymentStatus: transaction.status === 'completed' ? 'success' : 'pending'
    }));

    // Combine and sort results
    const searchResults = [...formattedOrders, ...formattedWalletTransactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: searchResults,
      totalResults: searchResults.length
    });
  } catch (error) {
    console.error("Search transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching transactions",
    });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionStats,
  getUserTransactions,
  searchTransactions
};