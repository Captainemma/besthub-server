const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["customer", "agent", "wholesaler", "admin"],
    default: "customer",
  },
  phone: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["active", "pending", "suspended"],
    default: "active",
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
module.exports = User;