const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: String,
  machineId: String,
  startDate: Date,
  endDate: Date,
  totalCost: Number,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
