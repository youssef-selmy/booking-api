const axios = require('axios');
const Reservation = require('../models/Reservation');
const Hotel = require('../models/hotelModel');
// POST /api/v1/front-office/recommendation
// Uses ONLY hotelId from token
exports.getRecommendation = async (req, res) => {
  try {
    // ✅ hotelId ONLY from token
    const hotelId = req.user?.hotel?.toString();

    if (!hotelId) {
      return res.status(403).json({
        status: "error",
        message: "Hotel ID not found in token"
      });
    }

    // =============================
    // 1️⃣ Fetch hotel basic context
    // =============================
    const hotel = await Hotel.findById(hotelId)
      .select("name city country stars amenities")
      .lean();

    if (!hotel) {
      return res.status(404).json({
        status: "error",
        message: "Hotel not found"
      });
    }

    // =============================
    // 2️⃣ Build AI prompt (GENERAL)
    // =============================
    const prompt = `
Hotel name: ${hotel.name}
Location: ${hotel.city || ""} ${hotel.country || ""}
Stars: ${hotel.stars || "N/A"}
Amenities: ${hotel.amenities?.join(", ") || "N/A"}

Provide short, practical, front-desk recommendations for guests staying at this hotel.
Focus on:
- check-in & stay experience
- common guest needs
- upselling opportunities
- service tips
- local tips if relevant

Keep it concise and actionable.
`;

    // =============================
    // 3️⃣ OpenRouter config
    // =============================
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL =
      process.env.OPENROUTER_MODEL || "gpt-3.5-mini";

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        status: "error",
        message: "OpenRouter API key not configured"
      });
    }

    const body = {
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional hotel front-desk assistant. Give concise, practical, and polite recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    };

    // =============================
    // 4️⃣ Call OpenRouter
    // =============================
    const resp = await axios.post(
      "https://api.openrouter.ai/v1/chat/completions",
      body,
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    const content =
      resp.data?.choices?.[0]?.message?.content ||
      resp.data?.choices?.[0]?.text ||
      "";

    // =============================
    // 5️⃣ Response
    // =============================
    return res.status(200).json({
      status: "success",
      hotelId,
      recommendation: content.trim()
    });

  } catch (err) {
    console.error(
      "Recommendation error:",
      err?.response?.data || err.message
    );

    return res.status(500).json({
      status: "error",
      message: "Failed to get recommendation"
    });
  }
};
