const Order = require("../../models/Order");
const User = require("../../models/User");

const getAllOrders = async (req, res) => {
  try {
    const { network, status, page = 1, limit = 20 } = req.query;
    
    let filters = {};
    
    if (network && network !== 'all') {
      filters.network = network;
    }
    
    if (status && status !== 'all') {
      filters.orderStatus = status;
    }

    const orders = await Order.find(filters)
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filters);

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalOrders: total
    });
  } catch (e) {
    console.error("Get all orders error:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.error("Get order details error:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const validStatuses = ["pending", "processing", "completed", "failed"];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    order.orderStatus = orderStatus;
    order.orderUpdateDate = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully!",
      data: order
    });
  } catch (e) {
    console.error("Update order status error:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ orderStatus: "completed" });
    const pendingOrders = await Order.countDocuments({ orderStatus: "pending" });
    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const revenueByNetwork = await Order.aggregate([
      { $match: { orderStatus: "completed" } },
      { $group: { _id: "$network", total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        revenueByNetwork
      }
    });
  } catch (e) {
    console.error("Get order stats error:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  getOrderStats
};