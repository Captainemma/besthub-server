const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  packageName: {
    type: String,
    required: true,
    trim: true
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

const priceSchema = new mongoose.Schema({
  network: {
    type: String,
    required: true,
    enum: ['MTN', 'Telecel', 'AT'],
    trim: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['customer', 'agent', 'wholesaler'],
    trim: true
  },
  packages: [packageSchema]
}, {
  timestamps: true
});

// Create compound index for unique network + userRole combinations
priceSchema.index({ network: 1, userRole: 1 }, { unique: true });

module.exports = mongoose.model('Price', priceSchema);