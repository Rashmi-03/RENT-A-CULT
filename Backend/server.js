const express = require("express");
const mongoose = require("mongoose");

const Booking = require("./models/Booking");
const Machine = require("./models/machine");

const app = express();
app.use(express.json());

const PORT = 5000;

// Direct MongoDB connection link (hardcoded here)
const mongoURI = "mongodb+srv://Rashmi04:<1234567890>@cluster0.z8wkr5v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Replace with your actual MongoDB connection string
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Book a machine
app.post("/book", async (req, res) => {
  const { userId, machineId, quantity } = req.body;

  try {
    const machine = await Machine.findById(machineId);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    if (machine.stock < quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    const booking = new Booking({ user: userId, machine: machineId, quantity });
    await booking.save();

    machine.stock -= quantity;
    await machine.save();

    res.status(201).json({ message: "Booking successful", booking });
  } catch (error) {
    res.status(500).json({ message: "Booking failed", error });
  }
});

// Get all bookings
app.get("/all", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("user").populate("machine");
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Failed to get bookings", error });
  }
});

// Accept booking
app.patch("/accept/:id", async (req, res) => {
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

// Reject booking and restore stock
app.patch("/reject/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("machine");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "rejected";
    await booking.save();

    booking.machine.stock += booking.quantity;
    await booking.machine.save();

    res.json({ message: "Booking rejected and stock restored", booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject booking", error });
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("Cultivator Rental System backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
