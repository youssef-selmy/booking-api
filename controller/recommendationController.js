const axios = require('axios');
const Reservation = require('../models/Reservation');
const Hotel = require('../models/hotelModel');
// const path = require('path');
// const dotenv = require('dotenv');
// dotenv.config({ path: path.join(__dirname, '..', 'config.env') });
// POST /api/v1/front-office/recommendation
// Uses ONLY hotelId from token




// exports.getRecommendation = async (req, res) => {
//   try {
//     // ✅ hotelId ONLY from token
//     const hotelId = req.user?.hotel?.toString();

//     if (!hotelId) {
//       return res.status(403).json({
//         status: "error",
//         message: "Hotel ID not found in token"
//       });
//     }

//     // =============================
//     // 1️⃣ Fetch hotel
//     // =============================
//     const hotel = await Hotel.findById(hotelId)
//       .select("name city country stars amenities")
//       .lean();

//     if (!hotel) {
//       return res.status(404).json({
//         status: "error",
//         message: "Hotel not found"
//       });
//     }

//     // =============================
//     // 2️⃣ Build prompt
//     // =============================
//     const prompt = `
// Hotel name: ${hotel.name}
// Location: ${hotel.city || ""} ${hotel.country || ""}
// Stars: ${hotel.stars || "N/A"}
// Amenities: ${hotel.amenities?.join(", ") || "N/A"}

// Provide short, practical front-desk recommendations for guests.
// Focus on:
// - check-in experience
// - guest comfort
// - upselling ideas
// - service tips
// - local tips (if relevant)

// Keep it concise.
// `;

//     // =============================
//     // 3️⃣ Gemini API call
//     // =============================
//     const GEMINI_API_KEY =
//       process.env.GEMINI_API_KEY ||
//       "AIzaSyCVvnYQ0tosdjJpvnwgtxzQgGuXQZoiJf0";

//    const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/text-bison-001:generateText?key=${GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             parts: [{ text: prompt }]
//           }
//         ]
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         },
//         timeout: 15000
//       }
//     );

//     const text =
//       response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

//     // =============================
//     // 4️⃣ Response
//     // =============================
//     return res.status(200).json({
//       status: "success",
//       hotelId,
//       recommendation: text.trim()
//     });

//   } catch (err) {
//     console.error("Gemini Recommendation error:", err?.response?.data || err.message);

//     return res.status(500).json({
//       status: "error",
//       message: "Failed to get recommendation"
//     });
//   }
// };






exports.getRecommendation = async (req, res) => {
  try {
    const hotelId = req.user?.hotel?.toString();
    if (!hotelId) {
      return res.status(403).json({
        status: "error",
        message: "Hotel ID not found in token"
      });
    }

    const hotel = await Hotel.findById(hotelId)
      .select("hotelName location totalRooms totalOwners services")
      .lean();

    if (!hotel) {
      return res.status(404).json({
        status: "error",
        message: "Hotel not found"
      });
    }

    const prompt = `
Hotel name: ${hotel.hotelName}
Location: ${hotel.location || "N/A"}
Total Rooms: ${hotel.totalRooms || "N/A"}
Total Owners: ${hotel.totalOwners || "N/A"}
Services: ${hotel.services || "N/A"}

Provide short, practical front-desk recommendations for guests.
Focus on check-in, guest comfort, upselling ideas, service tips, and local tips.
Keep it concise.
`;

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY||"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";
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        status: "error",
        message: "OpenRouter API key not configured"
      });
    }

  const response = await axios.post(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    model:"google/gemini-2.0-flash-001",
    messages: [
      {
        role: "system",
        content:
          "You are a professional hotel front-desk assistant. Give concise, practical, and polite recommendations in one line."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 300
  },
  {
    headers: {
      Authorization: `Bearer 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`,
      "Content-Type": "application/json",

      // ✅ REQUIRED BY OPENROUTER
      "HTTP-Referer": "http://localhost:8000",
      "X-Title": "Booking API" 
    },
    timeout: 20000
  }
);

    const recommendation =
      response.data?.choices?.[0]?.message?.content || "";

    return res.status(200).json({
      status: "success",
      hotelId,
      recommendation: recommendation.trim()
    });

  } catch (err) {
    console.error("OpenRouter Recommendation error:",
      err?.response?.data || err.message
    );

    return res.status(500).json({
      status: "error",
      message: "Failed to get recommendation"
    });
  }
};



exports.getManagerRecommendation = async (req, res) => {
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
    // 1️⃣ Fetch hotel data
    // =============================
    const hotel = await Hotel.findById(hotelId)
      .select("hotelName location totalRooms totalOwners services")
      .lean();

    if (!hotel) {
      return res.status(404).json({
        status: "error",
        message: "Hotel not found"
      });
    }

    // =============================
    // 2️⃣ Build MANAGER prompt
    // =============================
    const prompt = `
Hotel name: ${hotel.hotelName}
Location: ${hotel.location || "N/A"}
Total Rooms: ${hotel.totalRooms || "N/A"}
Total Owners: ${hotel.totalOwners || "N/A"}
Services: ${hotel.services || "N/A"}

Provide practical recommendations for the hotel manager.
Focus on:
- revenue optimization
- occupancy improvement
- staff efficiency
- guest satisfaction KPIs
- operational risks
- upselling & cost control

Keep it concise and actionable.
`;

    // =============================
    // 3️⃣ OpenRouter API call
    // =============================
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content:
              "You are an experienced hotel operations manager and consultant. Give concise, strategic, data-driven advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 350
      },
      {
        headers: {
          Authorization: `Bearer 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`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:8000",
          "X-Title": "Booking API"
        },
        timeout: 20000
      }
    );

    const recommendation =
      response.data?.choices?.[0]?.message?.content || "";

    // =============================
    // 4️⃣ Response
    // =============================
    return res.status(200).json({
      status: "success",
      hotelId,
      role: "manager",
      recommendation: recommendation.trim()
    });

  } catch (err) {
    console.error(
      "OpenRouter Manager Recommendation error:",
      err?.response?.data || err.message
    );

    return res.status(500).json({
      status: "error",
      message: "Failed to get manager recommendation"
    });
  }
};
