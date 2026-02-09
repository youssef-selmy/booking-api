const Reservation = require("../models/Reservation");
const Room = require("../models/roomModel");



exports.getDashboardOverview = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ===============================
    // OVERVIEW COUNTS
    // ===============================
    const todaysArrivals = await Reservation.countDocuments({
      checkIn: { $gte: todayStart, $lte: todayEnd },
    
    });

    const todaysDepartures = await Reservation.countDocuments({
      checkOut: { $gte: todayStart, $lte: todayEnd },
      
    });

    const inHouse = await Reservation.countDocuments({
      checkIn: { $lte: todayEnd },
      checkOut: { $gt: todayStart },
      
    });

    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: "occupied" });
    const availableRooms = totalRooms - occupiedRooms;

    const occupancyPercentage = totalRooms === 0
      ? 0
      : Math.round((occupiedRooms / totalRooms) * 100);

    // ===============================
    // REVENUE TODAY
    // ===============================
    const revenueTodayAgg = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$paidAmount" }
        }
      }
    ]);

    const revenueToday = revenueTodayAgg[0]?.total || 0;

    // ===============================
    // ROOM TYPE SUMMARY
    // ===============================
    const roomTypeSummary = await Room.aggregate([
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
          _id: "$type.name",
          total: { $sum: 1 }
        }
      }
    ]);

    // ===============================
    // TODAY'S ARRIVALS TABLE
    // ===============================
    const todaysArrivalTable = await Reservation.find({
      checkIn: { $gte: todayStart, $lte: todayEnd },
      status: "confirmed"
    })
      .populate("rooms.room", "roomNumber")
      .select("mainGuest rooms nights totalAmount paidAmount");

    // ===============================
    // TODAY'S DEPARTURE TABLE
    // ===============================
    const todaysDepartureTable = await Reservation.find({
      checkOut: { $gte: todayStart, $lte: todayEnd },
      status: "confirmed"
    })
      .populate("rooms.room", "roomNumber")
      .select("mainGuest rooms nights totalAmount paidAmount");

    res.status(200).json({
      status: "success",
      data: {
        overview: {
          todaysArrivals,
          todaysDepartures,
          inHouse,
          availableRooms,
          occupiedRooms,
          occupancyPercentage,
          revenueToday
        },
        roomTypeSummary,
        todaysArrivalTable,
        todaysDepartureTable
      }
    });
  } catch (error) {
    next(error);
  }
};
