const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');

// Add machine
router.post('/add', async (req, res) => {
  try {
    const { category, name, description, stock, pricePerDay } = req.body;
    const machine = new Machine({ category, name, description, stock, pricePerDay });
    await machine.save();
    res.json({ msg: 'Machine added', machine });
  } catch {
    res.status(500).json({ msg: 'Error adding machine' });
  }
});

// View all machines
router.get('/', async (req, res) => {
  try {
    const machines = await Machine.find();
    res.json(machines);
  } catch {
    res.status(500).json({ msg: 'Error fetching machines' });
  }
});

// Search/filter machines
router.get('/search', async (req, res) => {
  try {
    const { name, category } = req.query;
    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (category) query.category = { $regex: category, $options: 'i' };
    const machines = await Machine.find(query);
    res.json(machines);
  } catch {
    res.status(500).json({ msg: 'Error searching machines' });
  }
});

// Book machine (auto reduce stock)
router.post('/book', async (req, res) => {
  try {
    const { userId, machineId, startDate, endDate, totalCost } = req.body;

    const machine = await Machine.findById(machineId);
    if (!machine) return res.status(404).json({ msg: 'Machine not found' });
    if (machine.stock <= 0) return res.status(400).json({ msg: 'Out of stock' });

    machine.stock -= 1;
    await machine.save();

    const booking = new Booking({ userId, machineId, startDate, endDate, totalCost });
    await booking.save();

    res.json({ msg: 'Booked', booking });
  } catch {
    res.status(500).json({ msg: 'Error booking' });
  }
});

// User: View own bookings
router.get('/my-bookings/:userId', async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId });
    res.json(bookings);
  } catch {
    res.status(500).json({ msg: 'Error fetching bookings' });
  }
});

// Admin: View all bookings
router.get('/all-bookings', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch {
    res.status(500).json({ msg: 'Error fetching all bookings' });
  }
});

// Admin: Approve / Reject booking
router.put('/update-booking/:bookingId', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    // Restore stock if rejected
    if (status === 'Rejected') {
      const machine = await Machine.findById(booking.machineId);
      if (machine) {
        machine.stock += 1;
        await machine.save();
      }
    }

    booking.status = status;
    await booking.save();

    res.json({ msg: `Booking ${status.toLowerCase()} successfully`, booking });
  } catch {
    res.status(500).json({ msg: 'Error updating booking' });
  }
});

// User: Submit feedback
router.post('/feedback', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const fb = new Feedback({ userId, message });
    await fb.save();
    res.json({ msg: 'Feedback submitted', fb });
  } catch {
    res.status(500).json({ msg: 'Error submitting feedback' });
  }
});

// Admin: View all feedback
router.get('/feedbacks', async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.json(feedbacks);
  } catch {
    res.status(500).json({ msg: 'Error fetching feedbacks' });
  }
});

module.exports = router;
