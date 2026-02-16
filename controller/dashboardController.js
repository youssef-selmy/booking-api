const Reservation = require("../models/Reservation");
const Room = require("../models/roomModel");
const mongoose = require("mongoose");

exports.getDashboardOverview = async (req, res, next) => {
  try {
    const hotelId = req.user.hotel; // 🔥 IMPORTANT

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ===============================
    // ARRIVAL COUNT (HOTEL FILTERED)
    // ===============================
    const arrival = await Reservation.countDocuments({
      hotel: hotelId,
      checkIn: { $gte: todayStart, $lte: todayEnd },
      status: "confirmed"
    });

    // ===============================
    // DEPARTURE COUNT (HOTEL FILTERED)
    // ===============================
    const departure = await Reservation.countDocuments({
      hotel: hotelId,
      checkOut: { $gte: todayStart, $lte: todayEnd },
      status: "confirmed"
    });

    // ===============================
    // IN HOUSE (HOTEL FILTERED)
    // ===============================
    const inHouse = await Reservation.countDocuments({
      hotel: hotelId,
      stayStatus: "checked-in", // ⭐ better than date logic
      status: { $ne: "canceled" }
    });

    // ===============================
    // ROOM STATUS (HOTEL FILTERED)
    // ⚠️ Only works if Room model has hotel field
    // ===============================
    const totalRooms = await Room.countDocuments({ hotel: hotelId });
    const occupiedRooms = await Room.countDocuments({
      hotel: hotelId,
      status: "occupied"
    });
    const avilableRooms = totalRooms - occupiedRooms;

    // ===============================
    // ROOM SUMMARY BY CATEGORY + TYPE (HOTEL FILTERED)
    // ===============================
    const roomsAggregation = await Room.aggregate([
      {
        $match: {
          hotel: new mongoose.Types.ObjectId(hotelId) // 🔥 CRITICAL in aggregate
        }
      },
      {
        $lookup: {
          from: "roomcategories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "roomtypes",
          localField: "type",
          foreignField: "_id",
          as: "type"
        }
      },
      { $unwind: "$type" },
      {
        $group: {
          _id: {
            category: "$category.name",
            type: "$type.name"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.category",
          types: {
            $push: {
              name: "$_id.type",
              value: "$count"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          types: 1
        }
      }
    ]);

    // ===============================
    // TODAY ARRIVALS TABLE (HOTEL FILTERED)
    // ===============================
    const arrivalsData = await Reservation.find({
      hotel: hotelId,
      checkIn: { $gte: todayStart, $lte: todayEnd },
      status: "confirmed"
    }).populate("rooms.room");

    const arrivals = arrivalsData.flatMap(reservation =>
      reservation.rooms.map(r => ({
        roomNumber: r.room?.roomNumber || "-",
        name: `${reservation.mainGuest.firstName} ${reservation.mainGuest.lastName}`,
        bookedNights: r.nights,
        total: reservation.totalAmount,
        paid: reservation.paidAmount
      }))
    );

    // ===============================
    // TODAY DEPARTURES TABLE (HOTEL FILTERED)
    // ===============================
    const departuresData = await Reservation.find({
      hotel: hotelId,
      checkOut: { $gte: todayStart, $lte: todayEnd },
      status: "confirmed"
    }).populate("rooms.room");

    const departuers = departuresData.flatMap(reservation =>
      reservation.rooms.map(r => ({
        roomNumber: r.room?.roomNumber || "-",
        name: `${reservation.mainGuest.firstName} ${reservation.mainGuest.lastName}`,
        bookedNights: r.nights,
        total: reservation.totalAmount,
        paid: reservation.paidAmount
      }))
    );

    // ===============================
    // FINAL RESPONSE
    // ===============================
    res.status(200).json({
      arrival,
      departure,
      inHouse,
      avilableRooms,
      occupiedRooms,
      rooms: roomsAggregation,
      arrivals,
      departuers
    });

  } catch (error) {
    next(error);
  }
};
