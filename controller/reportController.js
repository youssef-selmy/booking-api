const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
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
    remainingAmount: r.remainingAmount || 0,
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
    idNumber: r.mainGuest.idNumber || "-",
    nationality: r.mainGuest.nationality || "-",
    arrivalDate: r.checkIn,
    departureDate: r.checkOut,
    paidAmount: r.paidAmount || 0
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
      remainingAmount: r.remainingAmount || 0,
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
      { stayStatus: "reserved", checkIn: { $lt: new Date() } }
    ]
  }).lean();

  const report = reservations.map(r => ({
    reservationNumber: r._id,
    guestName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
    checkIn: r.checkIn,
    status: r.status,
    stayStatus: r.stayStatus,
    lostRevenue: r.paidAmount || 0
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
    idNumber: r.mainGuest.idNumber || "-",
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
    (sum, r) => sum + (r.totalAmount || 0),
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
    (sum, r) => sum + (r.totalAmount || 0),
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








// ========================================
// 🧾 Folio History Report (Like Opera PMS)
// GET /api/reports/folio-history
// ========================================
// 🧾 Folio History Report (SECURE - Hotel from Token)
// 🧾 Folio History Report (SECURE - Hotel from Token)
exports.getFolioHistoryReport = asyncHandler(async (req, res) => {
  const hotelId = req.user.hotel;

  const {
    fromDate,
    toDate,
    stayStatus,
    status,
    travelAgent,
    confirmationNumber // 🔥 NEW
  } = req.query;

  const filter = {
    hotel: new mongoose.Types.ObjectId(hotelId)
  };

  // 🔥 CONFIRMATION NUMBER FILTER (ObjectId safe)
  if (confirmationNumber && mongoose.Types.ObjectId.isValid(confirmationNumber)) {
    filter._id = new mongoose.Types.ObjectId(confirmationNumber);
  }

  if (status) filter.status = status;
  if (stayStatus) filter.stayStatus = stayStatus;

  if (travelAgent && mongoose.Types.ObjectId.isValid(travelAgent)) {
    filter.travelAgent = new mongoose.Types.ObjectId(travelAgent);
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // 🔥 include full day
      filter.createdAt.$lte = to;
    }
  }

  const reservations = await Reservation.find(filter)
    .populate("travelAgent", "name") // 🔥 so frontend shows name
    .sort({ createdAt: -1 });

  let totalRevenue = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  const data = reservations.map((r) => {
    const guestName = `${r.mainGuest.firstName} ${r.mainGuest.lastName}`;

    const rooms = r.rooms.map((room) => ({
      roomNumber: room.room?.roomNumber,
      nights: room.nights,
      perDay: room.perDay,
      total: room.total
    }));

    const payments = r.payments.map((p) => ({
      amount: p.amount,
      method: p.method,
      date: p.date
    }));

    totalRevenue += r.totalAmount || 0;
    totalPaid += r.paidAmount || 0;
    totalRemaining += r.remainingAmount || 0;

    return {
      reservationId: r._id,
      guest: guestName,
      rooms,
      stayStatus: r.stayStatus,
      reservationStatus: r.status,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      remainingAmount: r.remainingAmount,
      payments,
      travelAgent: r.travelAgent,
      createdAt: r.createdAt
    };
  });

  res.status(200).json({
    status: "success",
    hotel: hotelId,
    results: data.length,
    summary: {
      totalRevenue,
      totalPaid,
      totalRemaining
    },
    data
  });
});



// 💰 Cashier Report (Token Based)
exports.getCashierReport = asyncHandler(async (req, res) => {
  const hotelId = req.user.hotel;
  const { fromDate, toDate, method } = req.query;

  const matchStage = {
    hotel: new mongoose.Types.ObjectId(hotelId)
  };

  if (fromDate || toDate) {
    matchStage.createdAt = {};
    if (fromDate) matchStage.createdAt.$gte = new Date(fromDate);
    if (toDate) matchStage.createdAt.$lte = new Date(toDate);
  }

  const pipeline = [
    { $match: matchStage },
    { $unwind: "$payments" }
  ];

  if (method) {
    pipeline.push({
      $match: { "payments.method": method }
    });
  }

  pipeline.push({
    $group: {
      _id: "$payments.method",
      totalAmount: { $sum: "$payments.amount" },
      transactions: { $sum: 1 }
    }
  });

  const result = await Reservation.aggregate(pipeline);

  let totalCash = 0;
  let grandTotal = 0;

  result.forEach((item) => {
    grandTotal += item.totalAmount;
    if (item._id?.toLowerCase() === "cash") {
      totalCash = item.totalAmount;
    }
  });

  res.status(200).json({
    status: "success",
    hotel: hotelId,
    summary: {
      grandTotal,
      totalCash,
      breakdown: result
    }
  });
});