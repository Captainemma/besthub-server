const Order = require('../../models/Order');
const User = require('../../models/User');

// Get all AirtelTigo orders
const getAllATOrders = async (req, res) => {
  try {
    console.log('🔄 Fetching all AirtelTigo orders...');
    
    // First, let's check what network values exist in orders
    const sampleOrders = await Order.find().limit(5).select('network productName').lean();
    console.log('🔍 Sample orders network fields:', sampleOrders.map(o => ({
      network: o.network,
      productName: o.productName
    })));

    // Try multiple possible field names for AT orders - FIXED CRITERIA
    const orders = await Order.find({
      $or: [
        { network: 'AT' }, // This is what's actually in your database
        { network: 'at' },
        { network: 'AirtelTigo' },
        { network: 'airteltigo' },
        { productType: 'at' },
        { productType: 'airteltigo' },
        { 'productName': { $regex: 'at', $options: 'i' } },
        { 'productName': { $regex: 'airteltigo', $options: 'i' } }
      ]
    })
      .populate('userId', 'userName email phone')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Found ${orders.length} AirtelTigo orders`);

    // Debug: Log the first order to see its structure
    if (orders.length > 0) {
      console.log('📝 Sample AirtelTigo order structure:', {
        _id: orders[0]._id,
        network: orders[0].network,
        productName: orders[0].productName,
        productType: orders[0].productType,
        status: orders[0].status
      });
    } else {
      console.log('❌ No orders found with current criteria');
      
      // Let's check if there are any orders at all
      const totalOrders = await Order.countDocuments();
      console.log(`📈 Total orders in database: ${totalOrders}`);
      
      // Check network distribution
      const networkStats = await Order.aggregate([
        { $group: { _id: '$network', count: { $sum: 1 } } }
      ]);
      console.log('🌐 Network distribution:', networkStats);
    }

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      user: order.userId?.userName || order.userName || 'Unknown User',
      email: order.userId?.email || order.email || 'N/A',
      phone: order.phoneNumber || order.phone || order.userId?.phone || 'N/A',
      package: order.productName || order.package || 'AirtelTigo Data Bundle',
      amount: order.amount || order.totalAmount || 0,
      date: order.createdAt || order.orderDate || new Date(),
      status: order.status || order.orderStatus || 'pending',
      reference: order.reference || order.orderId || `ORD-${order._id}`,
      validity: order.validity || '30 days',
      network: order.network || 'at',
      productType: order.productType || 'data'
    }));

    res.json({
      success: true,
      data: formattedOrders,
      total: formattedOrders.length
    });
  } catch (error) {
    console.error('❌ Get all AirtelTigo orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AirtelTigo orders',
      error: error.message
    });
  }
};

// Alternative: Get ALL orders and filter for AirtelTigo on backend
const getAllOrdersForAdmin = async (req, res) => {
  try {
    console.log('🔄 Fetching ALL orders for AirtelTigo admin...');
    
    const allOrders = await Order.find()
      .populate('userId', 'userName email phone')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Found ${allOrders.length} total orders`);

    // Filter for AirtelTigo orders on backend - MORE FLEXIBLE
    const atOrders = allOrders.filter(order => {
      const network = (order.network || '').toLowerCase();
      const productName = (order.productName || '').toLowerCase();
      const productType = (order.productType || '').toLowerCase();
      
      // Match AT, AirtelTigo, or any variation
      return network === 'at' || 
             network.includes('airtel') ||
             network.includes('tigo') ||
             productName.includes('at') || 
             productName.includes('airtel') ||
             productName.includes('tigo') ||
             productType === 'at' ||
             productType.includes('airtel') ||
             productType.includes('tigo');
    });

    console.log(`📱 Filtered ${atOrders.length} AirtelTigo orders`);

    const formattedOrders = atOrders.map(order => ({
      _id: order._id,
      user: order.userId?.userName || order.userName || 'Unknown User',
      email: order.userId?.email || order.email || 'N/A',
      phone: order.phoneNumber || order.phone || order.userId?.phone || 'N/A',
      package: order.productName || order.package || 'AirtelTigo Data Bundle',
      amount: order.amount || order.totalAmount || 0,
      date: order.createdAt || order.orderDate || new Date(),
      status: order.status || order.orderStatus || 'pending',
      reference: order.reference || order.orderId || `ORD-${order._id}`,
      validity: order.validity || '30 days',
      network: order.network || 'at',
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

    console.log(`🔄 Updating AirtelTigo order ${orderId} status to: ${status}`);

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

    console.log(`✅ AirtelTigo order ${orderId} status updated to: ${status}`);

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
    console.error('❌ Update AirtelTigo order status error:', error);
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

    console.log(`🔄 Bulk updating ${orderIds.length} AirtelTigo orders status to: ${status}`);

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

    console.log(`✅ Bulk updated ${result.modifiedCount} AirtelTigo orders`);

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} order(s)`,
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('❌ Bulk update AirtelTigo order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating orders status',
      error: error.message
    });
  }
};

module.exports = {
  getAllATOrders,
  getAllOrdersForAdmin,
  updateOrderStatus,
  bulkUpdateOrderStatus
};