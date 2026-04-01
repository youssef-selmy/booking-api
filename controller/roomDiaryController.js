const asyncHandler = require('express-async-handler');
const Room = require('../models/roomModel');
const Reservation = require('../models/Reservation');

exports.getRoomDiary = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  // =========================
  // 📅 1. Date Range (Today → +5 Days)
  // =========================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 5);
  endDate.setHours(23, 59, 59, 999);

  // =========================
  // 🛏️ 2. Get ONLY Hotel Rooms
  // =========================
  const rooms = await Room.find({
    hotel: hotelId,
    status: { $nin: ['maintenance', 'cleaning'] }
  })
    .select('_id roomNumber status floor')
    .sort({ roomNumber: 1 });

  // =========================
  // 📚 3. Get Reservations Overlapping Date Range
  // (supports multi-room reservations)
  // =========================
  const reservations = await Reservation.find({
    hotel: hotelId,
    status: { $ne: 'canceled' },
    checkIn: { $lt: endDate },
    checkOut: { $gt: today }
  }).select('checkIn checkOut stayStatus mainGuest rooms');

  console.log('🔍 Hotel ID:', hotelId);
  console.log('📅 Today:', today);
  console.log('📅 EndDate:', endDate);
  console.log('📦 Reservations Found:', reservations.length);
  reservations.forEach((res, idx) => {
    console.log(`  Reservation ${idx}: ${res.checkIn} to ${res.checkOut}, Rooms: ${res.rooms.length}`);
  });

  // =========================
  // ⚡ 4. Map reservations by room (HIGH PERFORMANCE)
  // =========================
  const roomReservationMap = {};

  for (const resv of reservations) {
    for (const r of resv.rooms) {
      // Skip if room is null (deleted or corrupted reference)
      if (!r.room) continue;

      const roomId = r.room._id.toString();
      console.log(`📌 Mapping Room ${roomId} to Reservation ${resv._id}`);

      if (!roomReservationMap[roomId]) {
        roomReservationMap[roomId] = [];
      }

      roomReservationMap[roomId].push(resv);
    }
  }

  console.log('🗺️ Room Reservation Map:', Object.keys(roomReservationMap));

  // =========================
  // 📆 5. Generate 6 Days (Today + 5)
  // =========================
  const daysArray = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    daysArray.push(date);
  }

  // =========================
  // 🧱 6. Build Room Diary Grid
  // =========================
  const diary = rooms.map(room => {
    const roomId = room._id.toString();
    const roomReservations = roomReservationMap[roomId] || [];

    const days = daysArray.map(day => {
      const dayNormalized = new Date(day);
      dayNormalized.setHours(0, 0, 0, 0);

      const booking = roomReservations.find(resv => {
        const checkIn = new Date(resv.checkIn);
        const checkOut = new Date(resv.checkOut);

        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);

        // Room occupied between checkIn (inclusive) and checkOut (exclusive)
        return dayNormalized >= checkIn && dayNormalized < checkOut;
      });

      if (booking) {
        return {
          date: day.toISOString().split('T')[0],
          status: booking.stayStatus, // reserved | checked-in | checked-out
          reservationId: booking._id,
          guestName: `${booking.mainGuest.firstName} ${booking.mainGuest.lastName}`,
          type: 'booked'
        };
      }

      return {
        date: day.toISOString().split('T')[0],
        status: 'available',
        type: 'empty'
      };
    });

    return {
      roomId: room._id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomStatus: room.status,
      days
    };
  });

  // =========================
  // 🎯 Response (Perfect for your UI grid)
  // =========================
  res.status(200).json({
    from: today,
    to: endDate,
    totalRooms: rooms.length,
    totalDays: 6,
    data: diary
  });
});
