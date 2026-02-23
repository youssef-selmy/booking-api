const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactoryController');
const ApiError = require('../utils/apiError');
const Reservation = require('../models/Reservation');
const Room = require("../models/roomModel");
// @desc    Get list of reservations
// @route   GET /api/v1/reservations
// @access  Private/Admin
exports.getReservations = asyncHandler(async (req, res, next) => {
  // reuse the generic filtering/pagination but make sure we populate travelAgent
  let filter = {};
  if (req.filterObj) filter = req.filterObj;

  const isAll = req.query.all === 'true';

  let apiFeatures = new ApiFeatures(
    Reservation.find(filter).populate('travelAgent', '_id name'),
    req.query
  )
    .filter()
    .search('reservation')
    .limitFields()
    .sort();

  let paginationResult;
  if (!isAll) {
    const documentsCounts = await Reservation.countDocuments(filter);
    apiFeatures = apiFeatures.paginate(documentsCounts);
    paginationResult = apiFeatures.paginationResult;
  }

  const documents = await apiFeatures.mongooseQuery;

  res.status(200).json({
    results: documents.length,
    ...(paginationResult && { paginationResult }),
    data: documents
  });
});

// @desc    Get specific reservation by id
// @route   GET /api/v1/reservations/:id
// @access  Private/Admin
exports.getReservation = asyncHandler(async (req, res, next) => {
  const filter = {
    _id: req.params.id,
    ...(req.filterObj || {})
  };

  const reservation = await Reservation.findOne(filter).populate('travelAgent', '_id name');

  if (!reservation) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }

  res.status(200).json({ data: reservation });
});






exports.setHotelToBody = (req, res, next) => {
  if (!req.user || !req.user.hotel) {
    return next(new ApiError("Hotel not found in token", 403));
  }

  // 🔥 force hotel from token
  req.body.hotel = req.user.hotel;

  next();
};

// @desc    Create reservation
// @route   POST /api/v1/reservations
// @access  Private/Admin
exports.createReservation = [
  exports.setHotelToBody,
  factory.createOne(Reservation)
];


// @desc    Update specific reservation
// @route   PUT /api/v1/reservations/:id
// @access  Private/Admin
exports.updateReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return next(new ApiError("Reservation not found", 404));
  }

  // =============================
  // ✅ Update dates (IMPORTANT)
  // =============================
  if (req.body.checkIn) {
    reservation.checkIn = new Date(req.body.checkIn);
  }

  if (req.body.checkOut) {
    reservation.checkOut = new Date(req.body.checkOut);
  }


  // Update main guest
  if (req.body.mainGuest) {
    reservation.mainGuest.firstName = req.body.mainGuest.firstName ?? reservation.mainGuest.firstName;
    reservation.mainGuest.lastName = req.body.mainGuest.lastName ?? reservation.mainGuest.lastName;
    reservation.mainGuest.age = req.body.mainGuest.age ?? reservation.mainGuest.age;
  }

  // Update additional guests
  if (req.body.additionalGuests) {
    reservation.additionalGuests = req.body.additionalGuests;
  }

  // Update rooms
  if (req.body.rooms) {
    reservation.rooms = req.body.rooms;
  }

  // Update services and packages
  if (req.body.services) reservation.services = req.body.services;
  if (req.body.packages) reservation.packages = req.body.packages;

  // Update payments
  if (req.body.payments) reservation.payments = req.body.payments;

  // Update status
  if (req.body.status) reservation.status = req.body.status;
    if (req.body.alerts) reservation.alerts = req.body.alerts;

  // Save triggers pre-save middleware to recalc totals
  await reservation.save();

  res.status(200).json({
    status: "success",
    data: reservation,
  });
});

// @desc    Delete specific reservation
// @route   DELETE /api/v1/reservations/:id
// @access  Private/Admin
exports.deleteReservation = factory.deleteOne(Reservation);





exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, ...filters } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        status: "fail",
        message: "checkIn and checkOut are required"
      });
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (startDate >= endDate) {
      return res.status(400).json({
        status: "fail",
        message: "checkOut must be after checkIn"
      });
    }

    // 🔒 Prevent undefined hotel crash (your previous error)
    if (!req.user || !req.user.hotel) {
      return res.status(401).json({
        status: "fail",
        message: "User hotel not found. Make sure protect middleware is used."
      });
    }

    const hotelId = req.user.hotel;

    // ============================================
    // 1️⃣ Find overlapping reservations (Booked Rooms)
    // ============================================
    const overlappingReservations = await Reservation.find({
      hotel: hotelId,
      stayStatus: { $in: ["reserved", "checked-in"] },
      status: { $ne: "canceled" },
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate }
    }).select("rooms.room");

    // Extract booked room IDs safely
    const bookedRoomIds = [
      ...new Set(
        overlappingReservations.flatMap(res =>
          res.rooms.map(r => {
            if (!r.room) return null;
            if (typeof r.room === "object" && r.room._id)
              return r.room._id.toString();
            return r.room.toString();
          })
        ).filter(Boolean)
      )
    ];

    // ============================================
    // 2️⃣ Base Query (EXCLUDE maintenance & cleaning)
    // ============================================
    let roomQuery = {
      hotel: hotelId,
      _id: { $nin: bookedRoomIds },

      // 🔥 THIS IS THE IMPORTANT PART
      // Exclude Out of Service + Housekeeping
       status: { $nin: ["maintenance", "cleaning", "occupied", "reserved"] }
      // Optional stricter version:
      // status: "available"
    };

    // ============================================
    // 3️⃣ Apply dynamic filters (unchanged logic)
    // ============================================
    Object.keys(filters).forEach(key => {

      // numeric fields
      if (["maxGuests", "MaxChildren", "floor"].includes(key)) {
        roomQuery[key] = Number(filters[key]);
      }

      // ObjectId fields
      else if (["category", "type", "_id"].includes(key)) {
        roomQuery[key] = filters[key];
      }

      // createdAt range filtering
      else if (key === "createdFrom") {
        roomQuery.createdAt = {
          ...roomQuery.createdAt,
          $gte: new Date(filters[key])
        };
      }
      else if (key === "createdTo") {
        roomQuery.createdAt = {
          ...roomQuery.createdAt,
          $lte: new Date(filters[key])
        };
      }

      // text fields
      else {
        roomQuery[key] = { $regex: filters[key], $options: "i" };
      }
    });

    // ============================================
    // 4️⃣ Get Available Rooms
    // ============================================
    const availableRooms = await Room.find(roomQuery)
      .populate("category")
      .populate("type")
      .lean();

    // 🔥 SAME RESPONSE FORMAT (no frontend break)
    res.status(200).json({
      status: "success",
      results: availableRooms.length,
      data: availableRooms
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};








exports.getHotelReservations = async (req, res) => {
  try {
    const hotelId = req.user.hotel;

    const {
      guest,
      status,
      stayStatus,
      fromDate,
      toDate,
      minRooms,
      maxRooms,
      minNights,
      maxNights,
      page = 1,
      limit = 10,
      sortBy = "arriveDate",
      sortOrder = "asc"
    } = req.query;

    if (!hotelId) {
      return res.status(403).json({
        success: false,
        message: "Hotel ID not found in token"
      });
    }

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.min(Number(limit), 100);
    const skip = (pageNum - 1) * limitNum;
    const order = sortOrder === "desc" ? -1 : 1;

    // =============================
    // 1️⃣ Build DB filter
    // =============================
    const dbFilter = { hotel: hotelId };

    if (status) dbFilter.status = status;
    if (stayStatus) dbFilter.stayStatus = stayStatus;

    if (fromDate || toDate) {
      dbFilter.checkIn = {};
      if (fromDate) dbFilter.checkIn.$gte = new Date(fromDate);
      if (toDate) dbFilter.checkIn.$lte = new Date(toDate);
    }

    // =============================
    // 2️⃣ Fetch reservations
    // =============================
    const reservations = await Reservation.find(dbFilter)
      .populate({
        path: "rooms.room",
        match: { hotel: hotelId },
        select: "hotel"
      })
      .populate({
        path: "travelAgent",
        select: "_id name"
      })
      .lean();

    // =============================
    // 3️⃣ Keep only hotel rooms
    // =============================
    let hotelReservations = reservations.filter(r =>
      r.rooms.some(room => room.room !== null)
    );

    // =============================
    // 4️⃣ In-memory filters
    // =============================

    // Guest name
    if (guest) {
      const g = guest.toLowerCase();
      hotelReservations = hotelReservations.filter(r =>
        `${r.mainGuest.firstName} ${r.mainGuest.lastName}`
          .toLowerCase()
          .includes(g)
      );
    }

    // Rooms count
    if (minRooms || maxRooms) {
      hotelReservations = hotelReservations.filter(r => {
        const count = r.rooms.filter(room => room.room !== null).length;
        if (minRooms && count < Number(minRooms)) return false;
        if (maxRooms && count > Number(maxRooms)) return false;
        return true;
      });
    }

    // Nights count
    if (minNights || maxNights) {
      hotelReservations = hotelReservations.filter(r => {
        const nights = r.rooms?.[0]?.nights || 0;
        if (minNights && nights < Number(minNights)) return false;
        if (maxNights && nights > Number(maxNights)) return false;
        return true;
      });
    }

    // =============================
    // 5️⃣ Format response
    // =============================
    let result = hotelReservations.map(r => {
      const hotelRooms = r.rooms.filter(room => room.room !== null);
      const nights = r.rooms?.[0]?.nights || 0;

      return {
        confirmationNumber: r._id,
        mainGuestName: `${r.mainGuest.firstName} ${r.mainGuest.lastName}`,
        travelAgent: r.travelAgent
          ? { id: r.travelAgent._id, name: r.travelAgent.name }
          : "-",
        roomsCount: hotelRooms.length,
        arriveDate: r.checkIn,
        departDate: new Date(
          new Date(r.checkIn).getTime() + nights * 86400000
        ),
        reservedNights: nights,
        status: r.status,
        stayStatus: r.stayStatus
      };
    });

    // =============================
    // 6️⃣ Sorting
    // =============================
    const sortMap = {
      confirmationNumber: r => r.confirmationNumber.toString(),
      guestName: r => r.mainGuestName.toLowerCase(),
      travelAgent: r =>
        typeof r.travelAgent === "object"
          ? r.travelAgent.name.toLowerCase()
          : "",
      arriveDate: r => new Date(r.arriveDate),
      departDate: r => new Date(r.departDate)
    };

    if (sortMap[sortBy]) {
      result.sort((a, b) => {
        const A = sortMap[sortBy](a);
        const B = sortMap[sortBy](b);
        if (A > B) return order;
        if (A < B) return -order;
        return 0;
      });
    }

    // =============================
    // 7️⃣ Pagination
    // =============================
    const total = result.length;
    const paginatedData = result.slice(skip, skip + limitNum);

    // =============================
    // 8️⃣ Response
    // =============================
    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      data: paginatedData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
