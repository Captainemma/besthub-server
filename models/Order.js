const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packageId: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  network: {
    type: String,
    required: true,
    enum: ['MTN', 'TELECEL', 'AT', 'AIRTELTIGO']
  },
  amount: {
    type: Number,
    required: true
  },
  packageName: {
    type: String,
    required: true
  },
  orderStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'completed', 'failed', 'processing']
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);