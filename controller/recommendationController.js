const axios = require('axios');
const Reservation = require('../models/Reservation');
const Hotel = require('../models/hotelModel');
// const path = require('path');
// const dotenv = require('dotenv');
// dotenv.config({ path: path.join(__dirname, '..', 'config.env') });
// POST /api/v1/front-office/recommendation
// Uses ONLY hotelId from token


exports.getRecommendation = async (req, res) => {
  try {
    const hotelId = req.user?.hotel?.toString();
    if (!hotelId)
      return res.status(403).json({ status: "error", message: "Hotel ID not found in token" });

    const hotel = await Hotel.findById(hotelId).select("name city country stars amenities").lean();
    if (!hotel) return res.status(404).json({ status: "error", message: "Hotel not found" });

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

    const OPENAI_API_KEY ="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";
    if (!OPENAI_API_KEY)
      return res.status(500).json({ status: "error", message: "OpenAI API key not configured" });

    const resp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a professional hotel front-desk assistant." },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = resp.data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ status: "success", hotelId, recommendation: content.trim() });

  } catch (err) {
    console.error("Recommendation error:", err?.response?.data || err.message);
    return res.status(500).json({ status: "error", message: "Failed to get recommendation" });
  }
};