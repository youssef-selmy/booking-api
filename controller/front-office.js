const Reservation = require("../models/Reservation");

exports.getUpcomingArrivals = async (req, res) => {
  try {
    const { hotelId } = req.user; // ✅ from token

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fiveDaysLater = new Date(today);
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 6);

    const reservations = await Reservation.find({
      checkIn: { $gte: today, $lt: fiveDaysLater },
      "rooms.room.hotel": hotelId
    })
      .select("mainGuest rooms checkIn travelAgent")
      .lean();

    const data = reservations.map(r => ({
      confirmationNumber: r._id,
      mainGuestName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
      travelAgent: r.travelAgent || "N/A",
      roomsCount: r.rooms.length,
      arriveDate: r.checkIn.toLocaleDateString("en-GB"),
      reservedNights: r.rooms[0]?.nights || 0
    }));

    res.status(200).json({
      status: "success",
      count: data.length,
      data
    });

  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};



exports.getDepartures = async (req, res) => {
  try {
    const { hotelId } = req.user;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fiveDaysLater = new Date(today);
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 6);
    fiveDaysLater.setHours(23, 59, 59, 999);

    const reservations = await Reservation.find({
      checkOut: { $gte: today, $lte: fiveDaysLater },
      "rooms.room.hotel": hotelId
    })
      .select("mainGuest rooms remainingAmount checkOut")
      .lean();

    const data = reservations.map(r => ({
      confirmationNumber: r._id,
      mainGuestName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
      roomsCount: r.rooms.length,
      reservedNights: r.rooms[0]?.nights || 0,
      remaining: r.remainingAmount,
      departureDate: r.checkOut.toLocaleDateString("en-GB")
    }));

    res.status(200).json({ count: data.length, data });

  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};



exports.getInHouse = async (req, res) => {
  try {
    const { hotelId } = req.user;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservations = await Reservation.find({
      checkIn: { $lte: today },
      checkOut: { $gt: today },
      stayStatus: "checked-in",
      "rooms.room.hotel": hotelId
    })
      .select("mainGuest rooms remainingAmount checkOut")
      .lean();

    const data = reservations.map(r => ({
      confirmationNumber: r._id,
      mainGuestName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
      roomsCount: r.rooms.length,
      reservedNights: r.rooms[0]?.nights || 0,
      remaining: r.remainingAmount,
      departureDate: r.checkOut.toLocaleDateString("en-GB")
    }));

    res.status(200).json({ count: data.length, data });

  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getNoShow = async (req, res) => {
  try {
    const { hotelId } = req.user;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservations = await Reservation.find({
      checkIn: { $lt: today },
      stayStatus: "reserved",
      status: { $ne: "canceled" },
      "rooms.room.hotel": hotelId
    })
      .select("mainGuest rooms totalAmount paidAmount checkIn")
      .lean();

    const data = reservations.map(r => ({
      confirmationNumber: r._id,
      mainGuestName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
      roomsCount: r.rooms.length,
      reservedNights: r.rooms[0]?.nights || 0,
      total: r.totalAmount,
      paid: r.paidAmount,
      arrivalDate: r.checkIn.toLocaleDateString("en-GB")
    }));

    res.status(200).json({ count: data.length, data });

  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};






exports.checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { hotelId } = req.user;

    const reservation = await Reservation.findById(id).populate("rooms.room");

    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });

    if (reservation.status === "canceled")
      return res.status(400).json({ message: "Reservation is canceled" });

    if (reservation.stayStatus !== "reserved")
      return res.status(400).json({ message: "Already checked in or completed" });

    // 🔐 Hotel ownership check
    const belongsToHotel = reservation.rooms.some(
      r => r.room.hotel.toString() === hotelId
    );

    if (!belongsToHotel)
      return res.status(403).json({ message: "Unauthorized hotel" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservation.checkIn > today)
      return res.status(400).json({ message: "Check-in date not reached yet" });

    reservation.stayStatus = "checked-in";
    reservation.status = "confirmed";
    // reservation.actualCheckIn = new Date();

    // 🏨 update rooms
    reservation.rooms.forEach(r => {
      r.room.status = "occupied";
      r.room.save();
    });

    await reservation.save();

    res.json({ message: "Checked in successfully", reservation });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { hotelId } = req.user;

    const reservation = await Reservation.findById(id).populate("rooms.room");

    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });

    if (reservation.stayStatus !== "checked-in")
      return res.status(400).json({ message: "Guest is not checked in" });

    const belongsToHotel = reservation.rooms.some(
      r => r.room.hotel.toString() === hotelId
    );

    if (!belongsToHotel)
      return res.status(403).json({ message: "Unauthorized hotel" });

    if (reservation.remainingAmount > 0)
      return res.status(400).json({ message: "Outstanding balance must be paid before checkout" });

    reservation.stayStatus = "checked-out";
    reservation.status = "completed";
    // reservation.actualCheckOut = new Date();

    // 🏨 free rooms
    reservation.rooms.forEach(r => {
      r.room.status = "available";
      r.room.save();
    });

    await reservation.save();

    res.json({ message: "Checked out successfully", reservation });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
