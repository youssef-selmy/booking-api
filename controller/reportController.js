const asyncHandler = require("express-async-handler");
const Reservation = require("../models/Reservation");
const Room = require("../models/roomModel");

exports.getExpectedArrivals = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;

  if (!req.user?.hotel) {
    return res.status(403).json({
      status: "fail",
      message: "Hotel not found in token"
    });
  }

  const hotelId = req.user.hotel;

  // Default: Today arrivals
  const start = fromDate ? new Date(fromDate) : new Date();
  const end = toDate
    ? new Date(toDate)
    : new Date(new Date().setHours(23, 59, 59, 999));

  const reservations = await Reservation.find({
    hotel: hotelId,
    stayStatus: "reserved",
    status: { $ne: "canceled" },
    checkIn: { $gte: start, $lte: end }
  })
    .populate("rooms.room", "roomNumber")
    .populate("travelAgent", "name companyName")
    .lean();

  const report = reservations.map(r => ({
    guestName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
    reservationNumber: r._id,
    bookingSource: r.travelAgent
      ? `Agent - ${r.travelAgent.name}`
      : "Direct",
    expectedArrival: r.checkIn,
    paymentStatus: r.paymentStatus || "pending",
    roomType: r.rooms?.[0]?.room?.roomNumber || "-",
    vipNotes: r.alerts || "-"
  }));

  res.status(200).json({
    status: "success",
    results: report.length,
    data: report
  });
});


exports.getInHouseGuests = asyncHandler(async (req, res) => {
  const hotelId = req.user.hotel;

  const reservations = await Reservation.find({
    hotel: hotelId,
    stayStatus: "checked-in",
    status: { $ne: "canceled" }
  })
    .populate("rooms.room", "roomNumber")
    .lean();

  const report = reservations.map(r => ({
    guestName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
    roomNumber: r.rooms?.[0]?.room?.roomNumber || "-",
    passport: r.mainGuest.passportNumber || "-",
    nationality: r.mainGuest.nationality || "-",
    arrivalDate: r.checkIn,
    departureDate: r.checkOut,
    balance: r.balance || 0
  }));

  res.status(200).json({
    status: "success",
    results: report.length,
    data: report
  });
});


exports.getReservationLedger = asyncHandler(async (req, res) => {
  const hotelId = req.user.hotel;

  const reservations = await Reservation.find({
    hotel: hotelId
  })
    .populate("travelAgent", "name")
    .lean();

  const ledger = reservations.map(r => {
    const nights =
      Math.ceil(
        (new Date(r.checkOut) - new Date(r.checkIn)) /
          (1000 * 60 * 60 * 24)
      ) || 0;

    return {
      reservationNumber: r._id,
      guestName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
      status: r.status,
      stayStatus: r.stayStatus,
      paymentStatus: r.paymentStatus || "pending",
      nights,
      bookingSource: r.travelAgent
        ? r.travelAgent.name
        : "Direct"
    };
  });

  res.status(200).json({
    status: "success",
    results: ledger.length,
    data: ledger
  });
});


exports.getNoShowAndCancellations = asyncHandler(async (req, res) => {
  const hotelId = req.user.hotel;

  const reservations = await Reservation.find({
    hotel: hotelId,
    $or: [
      { status: "canceled" },
      { stayStatus: "no-show" }
    ]
  }).lean();

  const report = reservations.map(r => ({
    reservationNumber: r._id,
    guestName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
    checkIn: r.checkIn,
    status: r.status,
    stayStatus: r.stayStatus,
    lostRevenue: r.totalPrice || 0
  }));

  res.status(200).json({
    status: "success",
    results: report.length,
    data: report
  });
});


exports.getPoliceReport = asyncHandler(async (req, res) => {
  const hotelId = req.user.hotel;

  const reservations = await Reservation.find({
    hotel: hotelId,
    stayStatus: "checked-in"
  })
    .populate("rooms.room", "roomNumber")
    .lean();

  const policeData = reservations.map(r => ({
    fullName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
    nationality: r.mainGuest.nationality || "-",
    passportNumber: r.mainGuest.passportNumber || "-",
    roomNumber: r.rooms?.[0]?.room?.roomNumber || "-",
    arrivalDate: r.checkIn,
    departureDate: r.checkOut
  }));

  res.status(200).json({
    status: "success",
    results: policeData.length,
    data: policeData
  });
});





exports.getRoomStatusReport = asyncHandler(async (req, res) => {
  const hotelId = req.user.hotel;

  const rooms = await Room.find({ hotel: hotelId }).lean();

  const report = rooms.map(room => ({
    roomNumber: room.roomNumber,
    statusCode:
      room.status === "available" ? "VC" :
      room.status === "occupied" ? "OC" :
      room.status === "maintenance" ? "OOO" :
      room.status === "cleaning" ? "OOS" :
      "NA",
    lastUpdated: room.updatedAt,
    floor: room.floor,
    notes: room.housekeepingNotes || "-"
  }));

  res.status(200).json({
    status: "success",
    results: report.length,
    data: report
  });
});



exports.getNightAuditReport = asyncHandler(async (req, res) => {
  const hotelId = req.user.hotel;
  const today = new Date();
  today.setHours(0,0,0,0);

  const reservations = await Reservation.find({
    hotel: hotelId,
    createdAt: { $gte: today }
  }).lean();

  const totalRevenue = reservations.reduce(
    (sum, r) => sum + (r.totalPrice || 0),
    0
  );

  const report = {
    date: today,
    totalReservations: reservations.length,
    roomRevenue: totalRevenue,
    taxes: totalRevenue * 0.14, // مصر VAT
    netRevenue: totalRevenue * 0.86
  };

  res.status(200).json({
    status: "success",
    data: report
  });
});





exports.getManagerFlashReport = asyncHandler(async (req, res) => {
  if (!req.user?.hotel) {
    return res.status(403).json({
      status: "fail",
      message: "Hotel not found in token"
    });
  }

  const hotelId = req.user.hotel;

  const { date } = req.query;

  // Default: today
  const reportDate = date ? new Date(date) : new Date();
  reportDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(reportDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // ============================
  // 1️⃣ Total Available Rooms
  // ============================
  const totalRooms = await Room.countDocuments({
    hotel: hotelId,
    status: { $ne: "maintenance" } // exclude OOO
  });

  // ============================
  // 2️⃣ Rooms Sold Today
  // ============================
  const reservations = await Reservation.find({
    hotel: hotelId,
    stayStatus: { $in: ["checked-in", "checked-out"] },
    status: { $ne: "canceled" },
    checkIn: { $lte: reportDate },
    checkOut: { $gt: reportDate }
  }).lean();

  const roomsSold = reservations.reduce(
    (sum, r) => sum + (r.rooms?.length || 0),
    0
  );

  const totalRoomRevenue = reservations.reduce(
    (sum, r) => sum + (r.totalPrice || 0),
    0
  );

  // ============================
  // 3️⃣ KPIs Calculations
  // ============================
  const occupancy =
    totalRooms > 0
      ? ((roomsSold / totalRooms) * 100).toFixed(2)
      : 0;

  const adr =
    roomsSold > 0
      ? (totalRoomRevenue / roomsSold).toFixed(2)
      : 0;

  const revpar =
    totalRooms > 0
      ? (totalRoomRevenue / totalRooms).toFixed(2)
      : 0;

  // ============================
  // 4️⃣ Final Response
  // ============================
  res.status(200).json({
    status: "success",
    data: {
      date: reportDate,
      roomsAvailable: totalRooms,
      roomsSold,
      totalRoomRevenue,
      occupancy: Number(occupancy),
      ADR: Number(adr),
      RevPAR: Number(revpar)
    }
  });
});
