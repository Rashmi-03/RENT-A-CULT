const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  category: String,
  name: String,
  description: String,
  stock: Number,
  pricePerDay: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Machine', machineSchema);
