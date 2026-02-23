const axios = require('axios');
const Reservation = require('../models/Reservation');

// POST /api/v1/front-office/recommendation
// body: { reservationId?: string, question?: string }
exports.getRecommendation = async (req, res) => {
  try {
    const { reservationId, question } = req.body || {};
    const hotelId = req.user && req.user.hotel ? req.user.hotel.toString() : null;

    let context = '';
    if (reservationId) {
      const reservation = await Reservation.findById(reservationId).lean();
      if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
      if (hotelId && reservation.hotel && reservation.hotel.toString() !== hotelId) {
        return res.status(403).json({ message: 'Unauthorized hotel' });
      }

      context = `Reservation: ${reservation._id}\nGuest: ${reservation.mainGuest?.firstName || ''} ${reservation.mainGuest?.lastName || ''}\nCheckIn: ${reservation.checkIn || 'N/A'}\nCheckOut: ${reservation.checkOut || 'N/A'}\nRooms: ${reservation.rooms?.length || 0}\nRemainingAmount: ${reservation.remainingAmount || 0}`;
    }

    const prompt = `${context}\n\nFront desk request: ${question || 'Provide short actionable recommendations for this reservation and guest.'}`;

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'gpt-3.5-mini';

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ message: 'OpenRouter API key not configured (OPENROUTER_API_KEY).' });
    }

    const body = {
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'You are an assistant for a hotel front desk. Provide concise, practical, and polite recommendations.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.2
    };

    const resp = await axios.post('https://api.openrouter.ai/v1/chat/completions', body, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const content = resp.data?.choices?.[0]?.message?.content || resp.data?.choices?.[0]?.text || '';

    return res.status(200).json({ status: 'success', recommendation: content.trim() });
  } catch (err) {
    console.error('Recommendation error:', err?.response?.data || err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to get recommendation', detail: err.message });
  }
};
