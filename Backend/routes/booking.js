const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Machine = require("../models/machine");

// Book a machine (User endpoint)
router.post("/book", async (req, res) => {
  const { userId, machineId, quantity } = req.body;

  try {
    const machine = await Machine.findById(machineId);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    if (machine.stock < quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    // Create booking
    const booking = new Booking({ user: userId, machine: machineId, quantity });
    await booking.save();

    // Reduce stock
    machine.stock -= quantity;
    await machine.save();

    res.status(201).json({ message: "Booking successful", booking });
  } catch (error) {
    res.status(500).json({ message: "Booking failed", error });
  }
});

// Admin: View all bookings
router.get("/all", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("user").populate("machine");
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Failed to get bookings", error });
  }
});

//  Admin: Accept booking
router.patch("/:id/accept", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );
    res.json({ message: "Booking accepted", booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to accept booking", error });
  }
});

// Admin: Reject booking & restore stock
router.patch("/:id/reject", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("machine");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "rejected";
    await booking.save();

    // Restore stock on rejection
    booking.machine.stock += booking.quantity;
    await booking.machine.save();

    res.json({ message: "Booking rejected and stock restored", booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject booking", error });
  }
});

module.exports = router;
