const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    default: 'system'
  },
  data: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);