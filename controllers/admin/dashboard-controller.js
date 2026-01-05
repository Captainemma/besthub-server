const User = require("../../models/User");
const Order = require("../../models/Order");
const { Wallet } = require("../../models/Wallet");
const mongoose = require("mongoose");

const getDashboardData = async (req, res) => {
  try {
    console.log("Fetching admin dashboard data...");

    // 1. Get total users count (all active users regardless of role)
    const totalUsers = await User.countDocuments({ status: "active" });
    console.log("Total users:", totalUsers);

    // 2. Get total customers count (only customers)
    const totalCustomers = await User.countDocuments({ 
      role: "customer", 
      status: "active" 
    });
    console.log("Total customers:", totalCustomers);

    // 3. Get total customer wallet balances - FIXED QUERY
    const customerWallets = await Wallet.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $match: {
          "user.role": "customer",
          "user.status": "active"
        }
      },
      {
        $group: {
          _id: null,
          totalCustomerBalance: { $sum: "$balance" }
        }
      }
    ]);

    const totalCustomerBalance = customerWallets[0]?.totalCustomerBalance || 0;
    console.log("Total customer balance:", totalCustomerBalance);

    // 4. Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySalesData = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: today },
          orderStatus: "completed"
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$price" }
        }
      }
    ]);

    const todaySales = todaySalesData[0]?.totalSales || 0;
    console.log("Today sales:", todaySales);

    // 5. Get total lifetime revenue (all completed orders)
    const lifetimeRevenueData = await Order.aggregate([
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

    const totalRevenue = lifetimeRevenueData[0]?.totalRevenue || 0;
    console.log("Total revenue:", totalRevenue);

    // 6. Get network-specific sales for today
    const networkSales = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: today },
          orderStatus: "completed"
        }
      },
      {
        $group: {
          _id: "$network",
          total: { $sum: "$price" }
        }
      }
    ]);

    // Convert network sales to object
    const salesByNetwork = {};
    networkSales.forEach(sale => {
      salesByNetwork[sale._id] = sale.total;
    });
    console.log("Network sales:", salesByNetwork);

    // 7. Get weekly transactions count
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyTransactions = await Order.countDocuments({
      orderDate: { $gte: weekAgo },
      orderStatus: "completed"
    });
    console.log("Weekly transactions:", weeklyTransactions);

    // 8. Get today's orders count
    const todayOrders = await Order.countDocuments({
      orderDate: { $gte: today },
      orderStatus: "completed"
    });
    console.log("Today orders:", todayOrders);

    // 9. Get active customers (customers with orders this month)
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const activeCustomers = await Order.distinct("userId", {
      orderDate: { $gte: monthAgo },
      orderStatus: "completed"
    });
    console.log("Active customers:", activeCustomers.length);

    // 10. Debug: Check if we have any data in collections
    const totalWallets = await Wallet.countDocuments();
    const totalOrders = await Order.countDocuments();
    console.log("Debug - Total wallets:", totalWallets);
    console.log("Debug - Total orders:", totalOrders);

    // 11. If no wallet data exists, create sample data for testing
    if (totalWallets === 0) {
      console.log("No wallet data found. Checking if we have users...");
      const users = await User.find({ role: "customer" }).limit(5);
      console.log("Sample users:", users.length);
    }

    res.status(200).json({
      success: true,
      data: {
        totalCustomerBalance,
        todaySales,
        totalRevenue,
        totalTransactions: weeklyTransactions,
        todayOrders,
        activeCustomers: activeCustomers.length,
        totalCustomers,
        totalUsers,
        mtnSales: salesByNetwork["mtn"] || 0,
        telecelSales: salesByNetwork["telecel"] || 0,
        atSales: salesByNetwork["airteltigo"] || 0
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data: ' + error.message
    });
  }
};

module.exports = { getDashboardData };