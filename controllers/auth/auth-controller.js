const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

//register - Updated for new user roles
const registerUser = async (req, res) => {
  const { userName, email, password, phone, role } = req.body;

  try {
    const checkUser = await User.findOne({ email });
    if (checkUser)
      return res.json({
        success: false,
        message: "User Already exists with the same email! Please try again",
      });

    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      userName,
      email,
      password: hashPassword,
      phone: phone || "",
      role: role || "customer", // Default to customer if not specified
      status: role === "customer" ? "active" : "pending" // Agents/Wholesalers need approval
    });

    await newUser.save();
    res.status(200).json({
      success: true,
      message: role === "customer" ? "Registration successful" : "Registration submitted for approval",
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        userName: newUser.userName
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred during registration",
    });
  }
};

//login - Updated for status check
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser)
      return res.json({
        success: false,
        message: "User doesn't exist! Please register first",
      });

    // Check if user account is suspended
    if (checkUser.status === "suspended") {
      return res.json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
      });
    }

    // Check if agent/wholesaler account is pending approval
    if (checkUser.status === "pending" && checkUser.role !== "customer") {
      return res.json({
        success: false,
        message: "Your account is pending approval. Please wait for admin approval.",
      });
    }

    const checkPasswordMatch = await bcrypt.compare(
      password,
      checkUser.password
    );
    if (!checkPasswordMatch)
      return res.json({
        success: false,
        message: "Incorrect password! Please try again",
      });

    const token = jwt.sign(
      {
        id: checkUser._id,
        role: checkUser.role,
        email: checkUser.email,
        userName: checkUser.userName,
        status: checkUser.status
      },
      "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    res.cookie("token", token, { httpOnly: true, secure: false }).json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser._id,
        userName: checkUser.userName,
        status: checkUser.status,
        phone: checkUser.phone,
        totalSpent: checkUser.totalSpent,
        totalOrders: checkUser.totalOrders
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred during login",
    });
  }
};

//logout - No changes needed
const logoutUser = (req, res) => {
  res.clearCookie("token").json({
    success: true,
    message: "Logged out successfully!",
  });
};

//auth middleware - Enhanced for role-based access
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({
      success: false,
      message: "Unauthorized user! Please login first",
    });

  try {
    const decoded = jwt.verify(token, "CLIENT_SECRET_KEY");
    
    // Check if user account is still active
    const user = await User.findById(decoded.id);
    if (!user || user.status === "suspended") {
      return res.status(401).json({
        success: false,
        message: "Account suspended or not found",
      });
    }

    req.user = {
      ...decoded,
      status: user.status
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token! Please login again",
    });
  }
};

// Admin middleware for protecting admin-only routes
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

// Agent middleware for agent-specific routes
const agentMiddleware = (req, res, next) => {
  if (!["admin", "agent", "wholesaler"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Agent or wholesaler privileges required.",
    });
  }
  next();
};

module.exports = { 
  registerUser, 
  loginUser, 
  logoutUser, 
  authMiddleware, 
  adminMiddleware,
  agentMiddleware 
};