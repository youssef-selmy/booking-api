const Reservation = require("../models/Reservation");

exports.getUpcomingArrivals = async (req, res) => {
  try {
    // ✅ Today (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ 5 days from today
    const fiveDaysLater = new Date(today);
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 6);

    const arrivals = await Reservation.find({
      checkIn: {
        $gte: today,
        $lt: fiveDaysLater
      },
    
    })
      .populate({
        path: "rooms.room",
        select: "roomNumber"
      })
      .lean();

    const formatted = arrivals.flatMap(reservation => {

      return reservation.rooms.map(room => {

        const nights = room.nights;

        return {
          id: reservation._id,
          name: `${reservation.mainGuest.firstName} ${reservation.mainGuest.lastName}`,
          idNumber: reservation.mainGuest.idNumber || "N/A",
          room: room.room?.roomNumber || "N/A",
          nights,
          arrivalDate: new Date(reservation.checkIn)
            .toLocaleDateString("en-GB")
        };
      });

    });

    res.status(200).json({
      status: "success",
      from: today,
      to: fiveDaysLater,
      results: formatted.length,
      data: formatted
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};



exports.getDepartures = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fiveDaysLater = new Date();
    fiveDaysLater.setDate(today.getDate() + 6);
    fiveDaysLater.setHours(23, 59, 59, 999);

    const reservations = await Reservation.find({
      checkOut: {
        $gte: today,
        $lte: fiveDaysLater
      },
      
    });

    const departures = [];

    reservations.forEach(reservation => {
      reservation.rooms.forEach(room => {
        departures.push({
          reservationId: reservation._id,
          name: `${reservation.mainGuest.firstName} ${reservation.mainGuest.lastName}`,
          roomNumber: room.room.roomNumber || room.room.number || "N/A",
          nights: room.nights,
          remaining: reservation.remainingAmount,
          checkoutDate: reservation.checkOut
        });
      });
    });

    res.status(200).json({
      count: departures.length,
      departures
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};



exports.getInHouse = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservations = await Reservation.find({
      checkIn: { $lte: today },
      checkOut: { $gt: today },
      
    });

    const inHouse = [];

    reservations.forEach(reservation => {
      reservation.rooms.forEach(room => {
        inHouse.push({
          reservationId: reservation._id,
          name: `${reservation.mainGuest.firstName} ${reservation.mainGuest.lastName}`,
          roomNumber: room.room.roomNumber || room.room.number || "N/A",
          nights: room.nights,
          remaining: reservation.remainingAmount,
          checkoutDate: reservation.checkOut
        });
      });
    });

    res.status(200).json({
      count: inHouse.length,
      inHouse
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};


exports.getNoShow = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

  const reservations = await Reservation.find({
      checkIn: { $lt: today },
      stayStatus: "reserved",   // guest never checked in
      status: { $ne: "canceled" } // exclude canceled bookings
    }).lean();

    const noShow = [];

    reservations.forEach(reservation => {
      reservation.rooms.forEach(room => {
        noShow.push({
          reservationId: reservation._id,
          name: `${reservation.mainGuest.firstName} ${reservation.mainGuest.lastName}`,
          roomNumber: room.room.roomNumber || "N/A",
          nights: room.nights,
          total: reservation.totalAmount,
          paid: reservation.paidAmount,
          checkInDate: reservation.checkIn
        });
      });
    });

    res.status(200).json({
      count: noShow.length,
      noShow
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};
