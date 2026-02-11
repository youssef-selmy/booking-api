const Reservation = require("../models/Reservation");
const Room = require("../models/roomModel");
const mongoose = require("mongoose");

exports.getDashboardOverview = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ===============================
    // ARRIVAL COUNT
    // ===============================
    const arrival = await Reservation.countDocuments({
      checkIn: { $gte: todayStart, $lte: todayEnd },
      status: "confirmed"
    });

    // ===============================
    // DEPARTURE COUNT
    // ===============================
    const departure = await Reservation.countDocuments({
      checkOut: { $gte: todayStart, $lte: todayEnd },
      status: "confirmed"
    });

    // ===============================
    // IN HOUSE
    // ===============================
    const inHouse = await Reservation.countDocuments({
      checkIn: { $lte: todayEnd },
      checkOut: { $gt: todayStart },
      status: "confirmed"
    });

    // ===============================
    // ROOM STATUS
    // ===============================
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: "occupied" });
    const avilableRooms = totalRooms - occupiedRooms;

    // ===============================
    // ROOM SUMMARY BY CATEGORY + TYPE
    // ===============================
    const roomsAggregation = await Room.aggregate([
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
    // TODAY ARRIVALS TABLE
    // ===============================
    const arrivalsData = await Reservation.find({
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
    // TODAY DEPARTURES TABLE
    // ===============================
    const departuresData = await Reservation.find({
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
