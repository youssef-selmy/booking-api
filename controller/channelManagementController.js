const asyncHandler = require("express-async-handler");
const axios = require("axios");

const ApiError = require("../utils/apiError");
const ChannelConnection = require("../models/channelConnectionModel");
const Reservation = require("../models/Reservation");
const Room = require("../models/roomModel");

const SUPPORTED_PROVIDERS = [
  {
    code: "booking.com",
    name: "Booking.com",
    note: "Usually connected through a partner or channel manager, not direct public APIs."
  },
  {
    code: "opera-cloud",
    name: "Oracle Opera Cloud",
    note: "Best used through Opera integration credentials or middleware approved by the property."
  },
  {
    code: "siteminder",
    name: "SiteMinder",
    note: "Recommended as a channel manager between OTAs and PMS."
  },
  {
    code: "cloudbeds",
    name: "Cloudbeds",
    note: "Can act as PMS/channel middleware for room and reservation sync."
  },
  {
    code: "custom",
    name: "Custom Middleware",
    note: "Use your own service that exposes normalized reservation data."
  }
];

const getValueByPath = (source, path) => {
  if (!source || !path) return undefined;

  return path.split(".").reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, source);
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
};

const normalizeString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeStatus = (status) => {
  const value = normalizeString(status).toLowerCase();

  if (!value) {
    return { status: "confirmed", stayStatus: "reserved" };
  }

  if (["cancelled", "canceled", "void"].includes(value)) {
    return { status: "canceled", stayStatus: "reserved" };
  }

  if (["checked-in", "checked_in", "inhouse", "in-house"].includes(value)) {
    return { status: "confirmed", stayStatus: "checked-in" };
  }

  if (["checked-out", "checked_out", "completed", "departed"].includes(value)) {
    return { status: "completed", stayStatus: "checked-out" };
  }

  if (["pending", "tentative"].includes(value)) {
    return { status: "pending", stayStatus: "reserved" };
  }

  return { status: "confirmed", stayStatus: "reserved" };
};

const getReservationsPayload = (payload, fieldMap = {}) => {
  const mapped = getValueByPath(payload, fieldMap.reservationsPath);
  if (Array.isArray(mapped)) return mapped;
  if (Array.isArray(payload?.reservations)) return payload.reservations;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeExternalReservation = (reservation, connection) => {
  const fieldMap = connection?.fieldMap || {};
  const mappedRoomIds = getValueByPath(reservation, fieldMap.roomIds);
  const mappedRoomNumbers = getValueByPath(reservation, fieldMap.roomNumbers);
  const guest = reservation.guest || reservation.mainGuest || {};

  return {
    externalReservationId: normalizeString(
      getValueByPath(reservation, fieldMap.reservationId) ||
      reservation.externalReservationId ||
      reservation.reservationId ||
      reservation.id ||
      reservation.bookingId
    ),
    firstName: normalizeString(
      getValueByPath(reservation, fieldMap.guestFirstName) ||
      guest.firstName ||
      reservation.firstName
    ) || "Channel",
    lastName: normalizeString(
      getValueByPath(reservation, fieldMap.guestLastName) ||
      guest.lastName ||
      reservation.lastName
    ) || "Guest",
    checkIn: getValueByPath(reservation, fieldMap.checkIn) || reservation.checkIn || reservation.arrivalDate,
    checkOut: getValueByPath(reservation, fieldMap.checkOut) || reservation.checkOut || reservation.departureDate,
    roomIds: toArray(mappedRoomIds || reservation.roomIds || reservation.roomCodes),
    roomNumbers: toArray(mappedRoomNumbers || reservation.roomNumbers),
    totalAmount: Number(
      getValueByPath(reservation, fieldMap.totalAmount) ||
      reservation.totalAmount ||
      reservation.amount ||
      0
    ),
    paidAmount: Number(
      getValueByPath(reservation, fieldMap.paidAmount) ||
      reservation.paidAmount ||
      0
    ),
    status: getValueByPath(reservation, fieldMap.status) || reservation.status,
    raw: reservation
  };
};

const buildRoomLookup = (connection) => {
  const roomLookup = new Map();

  (connection?.roomMap || []).forEach((entry) => {
    roomLookup.set(normalizeString(entry.externalRoomId), normalizeString(entry.localRoomNumber));
  });

  return roomLookup;
};

const resolveRoomNumbers = (normalizedReservation, roomLookup) => {
  const mappedFromExternalIds = normalizedReservation.roomIds
    .map((roomId) => roomLookup.get(normalizeString(roomId)))
    .filter(Boolean);

  const directRoomNumbers = normalizedReservation.roomNumbers.map(normalizeString).filter(Boolean);

  const fallbackIdsAsNumbers = normalizedReservation.roomIds
    .map(normalizeString)
    .filter(Boolean);

  return [...new Set([
    ...mappedFromExternalIds,
    ...directRoomNumbers,
    ...fallbackIdsAsNumbers
  ])];
};

const buildRequestConfig = (connection, syncOptions = {}) => {
  const headers = Object.fromEntries(connection.requestHeaders || []);
  const params = Object.fromEntries(connection.queryTemplate || []);

  if (connection.propertyId && !params.propertyId && !params.hotelId) {
    params.propertyId = connection.propertyId;
  }

  if (syncOptions.fromDate) {
    params.fromDate = syncOptions.fromDate;
  }

  if (syncOptions.toDate) {
    params.toDate = syncOptions.toDate;
  }

  if (connection.authType === "bearer" && connection.credentials?.token) {
    headers.Authorization = `Bearer ${connection.credentials.token}`;
  }

  if (connection.authType === "api-key" && connection.credentials?.apiKey) {
    headers[connection.credentials.apiKeyHeader || "x-api-key"] = connection.credentials.apiKey;
  }

  const requestConfig = {
    method: "get",
    url: `${connection.baseUrl || ""}${connection.reservationsPath || ""}`,
    headers,
    params,
    timeout: Number(process.env.CHANNEL_SYNC_TIMEOUT_MS || 30000)
  };

  if (connection.authType === "basic" && connection.credentials?.username) {
    requestConfig.auth = {
      username: connection.credentials.username,
      password: connection.credentials.password || ""
    };
  }

  return requestConfig;
};

const syncReservationsForHotel = async ({
  hotelId,
  connection,
  reservationsPayload
}) => {
  if (!Array.isArray(reservationsPayload) || reservationsPayload.length === 0) {
    return {
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      warnings: ["No reservations were returned by the provider."]
    };
  }

  const roomLookup = buildRoomLookup(connection);
  const summary = {
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    warnings: []
  };

  for (const externalReservation of reservationsPayload) {
    try {
      const normalized = normalizeExternalReservation(externalReservation, connection);

      if (!normalized.externalReservationId) {
        summary.failed += 1;
        summary.warnings.push("Skipped one reservation because externalReservationId is missing.");
        continue;
      }

      if (!normalized.checkIn || !normalized.checkOut) {
        summary.failed += 1;
        summary.warnings.push(`Reservation ${normalized.externalReservationId} is missing check-in/check-out.`);
        continue;
      }

      const roomNumbers = resolveRoomNumbers(normalized, roomLookup);

      if (roomNumbers.length === 0) {
        summary.failed += 1;
        summary.warnings.push(`Reservation ${normalized.externalReservationId} has no mapped room numbers.`);
        continue;
      }

      const rooms = await Room.find({
        hotel: hotelId,
        roomNumber: { $in: roomNumbers }
      }).select("_id roomNumber");

      if (!rooms.length) {
        summary.failed += 1;
        summary.warnings.push(`Reservation ${normalized.externalReservationId} rooms do not exist locally.`);
        continue;
      }

      const perRoomRate = rooms.length
        ? Number(((normalized.totalAmount || connection.defaultRate || 0) / rooms.length).toFixed(2))
        : Number(connection.defaultRate || 0);

      const normalizedReservationStatus = normalizeStatus(normalized.status);

      const payload = {
        hotel: hotelId,
        mainGuest: {
          firstName: normalized.firstName,
          lastName: normalized.lastName
        },
        rooms: rooms.map((room) => ({
          room: room._id,
          perDay: perRoomRate || Number(connection.defaultRate || 0)
        })),
        checkIn: new Date(normalized.checkIn),
        checkOut: new Date(normalized.checkOut),
        payments: normalized.paidAmount > 0 ? [{
          amount: normalized.paidAmount,
          method: "channel-import"
        }] : [],
        status: normalizedReservationStatus.status,
        stayStatus: normalizedReservationStatus.stayStatus,
        channelManager: {
          provider: connection.provider,
          externalReservationId: normalized.externalReservationId,
          externalRoomIds: normalized.roomIds.map(normalizeString).filter(Boolean),
          importedAt: new Date(),
          lastSyncAt: new Date(),
          rawReservation: normalized.raw
        }
      };

      const existing = await Reservation.findOne({
        hotel: hotelId,
        "channelManager.provider": connection.provider,
        "channelManager.externalReservationId": normalized.externalReservationId
      });

      if (existing) {
        if (["checked-in", "checked-out"].includes(existing.stayStatus)) {
          existing.channelManager = payload.channelManager;
          await existing.save();
          summary.skipped += 1;
          summary.warnings.push(
            `Reservation ${normalized.externalReservationId} was not overwritten because local stay status is ${existing.stayStatus}.`
          );
          continue;
        }

        existing.mainGuest = payload.mainGuest;
        existing.rooms = payload.rooms;
        existing.checkIn = payload.checkIn;
        existing.checkOut = payload.checkOut;
        existing.payments = payload.payments;
        existing.status = payload.status;
        existing.stayStatus = payload.stayStatus;
        existing.channelManager = payload.channelManager;
        await existing.save();
        summary.updated += 1;
        continue;
      }

      await Reservation.create(payload);
      summary.imported += 1;
    } catch (error) {
      summary.failed += 1;
      summary.warnings.push(error.message);
    }
  }

  return summary;
};

exports.listSupportedProviders = asyncHandler(async (req, res) => {
  res.status(200).json({
    data: SUPPORTED_PROVIDERS
  });
});

exports.getConnection = asyncHandler(async (req, res) => {
  const connection = await ChannelConnection.findOne({ hotel: req.user.hotel }).lean();

  res.status(200).json({
    data: connection || null
  });
});

exports.upsertConnection = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;

  if (!req.body.provider) {
    return next(new ApiError("provider is required", 400));
  }

  const update = {
    provider: req.body.provider,
    enabled: req.body.enabled !== undefined ? req.body.enabled : true,
    connectionMode: req.body.connectionMode || "api",
    baseUrl: req.body.baseUrl || "",
    reservationsPath: req.body.reservationsPath || "/reservations",
    propertyId: req.body.propertyId || "",
    authType: req.body.authType || "bearer",
    credentials: req.body.credentials || {},
    defaultRate: Number(req.body.defaultRate || 0),
    requestHeaders: req.body.requestHeaders || {},
    queryTemplate: req.body.queryTemplate || {},
    fieldMap: req.body.fieldMap || {},
    roomMap: Array.isArray(req.body.roomMap) ? req.body.roomMap : []
  };

  const connection = await ChannelConnection.findOneAndUpdate(
    { hotel: hotelId },
    { hotel: hotelId, ...update },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    message: "Channel management connection saved successfully.",
    data: connection
  });
});

exports.syncReservations = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;
  const connection = await ChannelConnection.findOne({ hotel: hotelId });

  if (!connection || !connection.enabled) {
    return next(new ApiError("No enabled channel management connection found for this hotel.", 404));
  }

  if (!connection.baseUrl && !Array.isArray(req.body?.reservations)) {
    return next(new ApiError("baseUrl is required for provider pull sync, or send reservations manually in the request body.", 400));
  }

  let reservationsPayload = req.body?.reservations;

  if (!Array.isArray(reservationsPayload)) {
    const requestConfig = buildRequestConfig(connection, req.body || {});
    const response = await axios(requestConfig);
    reservationsPayload = getReservationsPayload(response.data, connection.fieldMap);
  }

  const summary = await syncReservationsForHotel({
    hotelId,
    connection,
    reservationsPayload
  });

  connection.lastSyncAt = new Date();
  connection.lastSyncStatus = summary.failed ? "failed" : "success";
  connection.lastSyncMessage = `Imported ${summary.imported}, updated ${summary.updated}, skipped ${summary.skipped}, failed ${summary.failed}`;
  await connection.save();

  res.status(200).json({
    message: "Channel reservations sync finished.",
    summary
  });
});

exports.importReservations = asyncHandler(async (req, res, next) => {
  const hotelId = req.user.hotel;
  const connection = await ChannelConnection.findOne({ hotel: hotelId });

  if (!connection) {
    return next(new ApiError("Create a channel connection first before importing reservations.", 400));
  }

  if (!Array.isArray(req.body?.reservations)) {
    return next(new ApiError("reservations array is required", 400));
  }

  const summary = await syncReservationsForHotel({
    hotelId,
    connection,
    reservationsPayload: req.body.reservations
  });

  connection.lastSyncAt = new Date();
  connection.lastSyncStatus = summary.failed ? "failed" : "success";
  connection.lastSyncMessage = `Imported ${summary.imported}, updated ${summary.updated}, skipped ${summary.skipped}, failed ${summary.failed}`;
  await connection.save();

  res.status(200).json({
    message: "Manual reservation import finished.",
    summary
  });
});
