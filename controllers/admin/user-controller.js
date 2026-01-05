const User = require("../../models/User");
const Order = require("../../models/Order");

const getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    
    let filters = {};
    
    if (role && role !== 'all') {
      filters.role = role;
    }
    
    if (status && status !== 'all') {
      filters.status = status;
    }

    const users = await User.find(filters)
      .select('-password') // Exclude passwords
      .sort({ registrationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUsers: total
    });
  } catch (e) {
    console.error("Get users error:", e);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Get user's order history
    const userOrders = await Order.find({ userId: id }).sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        user: user,
        orders: userOrders
      },
    });
  } catch (e) {
    console.error("Get user details error:", e);
    res.status(500).json({
      success: false,
      message: "Error fetching user details",
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["customer", "agent", "wholesaler", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    user.role = role;
    // Auto-activate when role is changed by admin
    if (user.status === "pending") {
      user.status = "active";
    }
    
    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully!",
      data: user,
    });
  } catch (e) {
    console.error("Update user role error:", e);
    res.status(500).json({
      success: false,
      message: "Error updating user role",
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "pending", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user status",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User status updated successfully!",
      data: user,
    });
  } catch (e) {
    console.error("Update user status error:", e);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ role: "customer" });
    const agents = await User.countDocuments({ role: "agent" });
    const wholesalers = await User.countDocuments({ role: "wholesaler" });
    const admins = await User.countDocuments({ role: "admin" });
    const activeUsers = await User.countDocuments({ status: "active" });
    const pendingUsers = await User.countDocuments({ status: "pending" });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        byRole: { customers, agents, wholesalers, admins },
        byStatus: { active: activeUsers, pending: pendingUsers }
      }
    });
  } catch (e) {
    console.error("Get user stats error:", e);
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
    });
  }
};


const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account!",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Prevent deletion of other admin accounts (optional security measure)
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin accounts!",
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully!",
    });
  } catch (e) {
    console.error("Delete user error:", e);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};


module.exports = {
  getAllUsers,
  getUserDetails,
  updateUserRole,
  updateUserStatus,
  getUserStats,
  deleteUser,
};