const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

// Import routes
const authRouter = require("./routes/auth/auth-routes");
const shopProductsRouter = require("./routes/shop/products-routes");
const shopWalletRouter = require("./routes/shop/wallet-routes");
const dashboardRoutes = require("./routes/admin/dashboard-routes");
const adminUsersRoutes = require("./routes/admin/user-routes");
const adminTransactionsRoutes = require("./routes/admin/transactions-routes"); 
const adminWalletRoutes = require("./routes/admin/wallet-routes");
const adminMTNOrdersRoutes = require("./routes/admin/mtn-orders-routes");
const adminTelecelOrdersRoutes = require("./routes/admin/telecel-orders-routes");
const adminATOrdersRoutes = require("./routes/admin/at-orders-routes");
const adminPriceRoutes = require("./routes/admin/price-routes");
const shopOrderRouter = require("./routes/shop/order-routes");
const adminSettingsRoutes = require('./routes/admin/settings-routes');



// Create database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

const app = express();
const PORT = process.env.PORT || 4400;


app.use(cors({
  origin: [
    "https://besthubgh.vercel.app",  // Your Vercel URL
    "http://localhost:5173"           // Local development
  ],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());


// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`, req.body);
  next();
});

// Add this before your 404 handler to see what routes are being hit
app.use((req, res, next) => {
  console.log(`🔍 Checking route: ${req.method} ${req.url}`);
  next();
});
// API Routes
app.use("/api/auth", authRouter);
app.use("/api/shop/products", shopProductsRouter);
app.use("/api/shop/wallet", shopWalletRouter);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/transactions", adminTransactionsRoutes);
app.use("/api/admin/wallets", adminWalletRoutes);
app.use("/api/admin/orders/mtn", adminMTNOrdersRoutes);
app.use("/api/admin/orders/telecel", adminTelecelOrdersRoutes);
app.use("/api/admin/orders/at", adminATOrdersRoutes);
app.use("/api/admin/prices", adminPriceRoutes);
app.use("/api/shop/orders", shopOrderRouter);
app.use("/api/admin/settings", adminSettingsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});



// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "Data Selling Platform API",
    endpoints: {
      auth: "/api/auth",
      products: "/api/shop/products",
      wallet: "/api/shop/wallet",
      admin: {
        dashboard: "/api/admin/dashboard",
        users: "/api/admin/users",
        transactions: "/api/admin/transactions",
        wallets: "/api/admin/wallets"
      },
      health: "/api/health"
    }
  });
});

// Simple 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found"
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});