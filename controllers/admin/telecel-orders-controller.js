const Order = require('../../models/Order');
const User = require('../../models/User');

// Get all Telecel orders
const getAllTelecelOrders = async (req, res) => {
  try {
    console.log('🔄 Fetching all Telecel orders...');
    
    // Try multiple possible field names for Telecel orders
    const orders = await Order.find({
      $or: [
        { productType: 'telecel' },
        { network: 'telecel' },
        { network: 'TELECEL' },
        { network: 'Telecel' },
        { 'productName': { $regex: 'telecel', $options: 'i' } },
        { 'productName': { $regex: 'vodafone', $options: 'i' } },
        { 'package': { $regex: 'telecel', $options: 'i' } }
      ]
    })
      .populate('userId', 'userName email phone')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Found ${orders.length} Telecel orders`);

    // Debug: Log the first order to see its structure
    if (orders.length > 0) {
      console.log('📝 Sample Telecel order structure:', JSON.stringify(orders[0], null, 2));
    }

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      user: order.userId?.userName || order.userName || 'Unknown User',
      email: order.userId?.email || order.email || 'N/A',
      phone: order.phoneNumber || order.phone || order.userId?.phone || 'N/A',
      package: order.productName || order.package || 'Telecel Data Bundle',
      amount: order.amount || order.totalAmount || 0,
      date: order.createdAt || order.orderDate || new Date(),
      status: order.status || order.orderStatus || 'pending',
      reference: order.reference || order.orderId || `ORD-${order._id}`,
      validity: order.validity || '30 days',
      network: order.network || 'telecel',
      productType: order.productType || 'data'
    }));

    res.json({
      success: true,
      data: formattedOrders,
      total: formattedOrders.length
    });
  } catch (error) {
    console.error('❌ Get all Telecel orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Telecel orders',
      error: error.message
    });
  }
};

// Alternative: Get ALL orders and filter for Telecel on backend
const getAllOrdersForAdmin = async (req, res) => {
  try {
    console.log('🔄 Fetching ALL orders for Telecel admin...');
    
    const allOrders = await Order.find()
      .populate('userId', 'userName email phone')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Found ${allOrders.length} total orders`);

    // Filter for Telecel orders on backend
    const telecelOrders = allOrders.filter(order => {
      const network = order.network?.toLowerCase();
      const productName = order.productName?.toLowerCase();
      const productType = order.productType?.toLowerCase();
      
      return network === 'telecel' || 
             network === 'vodafone' ||
             productName?.includes('telecel') || 
             productName?.includes('vodafone') ||
             productType === 'telecel';
    });

    console.log(`📱 Filtered ${telecelOrders.length} Telecel orders`);

    const formattedOrders = telecelOrders.map(order => ({
      _id: order._id,
      user: order.userId?.userName || order.userName || 'Unknown User',
      email: order.userId?.email || order.email || 'N/A',
      phone: order.phoneNumber || order.phone || order.userId?.phone || 'N/A',
      package: order.productName || order.package || 'Telecel Data Bundle',
      amount: order.amount || order.totalAmount || 0,
      date: order.createdAt || order.orderDate || new Date(),
      status: order.status || order.orderStatus || 'pending',
      reference: order.reference || order.orderId || `ORD-${order._id}`,
      validity: order.validity || '30 days',
      network: order.network || 'telecel',
      productType: order.productType || 'data'
    }));

    res.json({
      success: true,
      data: formattedOrders,
      total: formattedOrders.length,
      allOrdersCount: allOrders.length
    });
  } catch (error) {
    console.error('❌ Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`🔄 Updating Telecel order ${orderId} status to: ${status}`);

    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        orderStatus: status // Update both fields for compatibility
      },
      { new: true }
    ).populate('userId', 'userName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log(`✅ Telecel order ${orderId} status updated to: ${status}`);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        _id: order._id,
        user: order.userId?.userName,
        package: order.productName,
        amount: order.amount,
        status: order.status,
        reference: order.reference
      }
    });
  } catch (error) {
    console.error('❌ Update Telecel order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Bulk update order status
const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    console.log(`🔄 Bulk updating ${orderIds.length} Telecel orders status to: ${status}`);

    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        status,
        orderStatus: status // Update both fields for compatibility
      }
    );

    console.log(`✅ Bulk updated ${result.modifiedCount} Telecel orders`);

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} order(s)`,
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('❌ Bulk update Telecel order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating orders status',
      error: error.message
    });
  }
};

module.exports = {
  getAllTelecelOrders,
  getAllOrdersForAdmin,
  updateOrderStatus,
  bulkUpdateOrderStatus
};