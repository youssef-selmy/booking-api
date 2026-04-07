const SettingsLog = require("../models/settingsLogModel");

const safeStringify = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

exports.createHotelLog = async ({
  hotel,
  user,
  action,
  target,
  details,
}) => {
  try {
    if (!hotel || !action || !target) return;

    await SettingsLog.create({
      hotel,
      user,
      action,
      target,
      details: safeStringify(details),
    });
  } catch (error) {
    console.error("hotel log create error", error);
  }
};
