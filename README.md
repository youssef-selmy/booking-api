# Booking API

Backend API for hotel booking and front-office operations. It covers authentication, hotels, rooms, pricing, reservations, inventory, and reporting.

**Highlights**
- JWT authentication and role-aware access patterns
- Hotel, room, and reservation management
- Front-office workflows (arrivals, departures, in-house, no-show, check-in, check-out)
- Inventory and housekeeping status management
- Reporting endpoints for operations and audit
- Channel management connection and reservation sync for Booking.com, Opera Cloud, SiteMinder, Cloudbeds, or custom middleware

**Tech Stack**
- Node.js, Express
- MongoDB, Mongoose
- JWT auth, multer uploads, Cloudinary storage
- Nodemailer, Stripe (optional), OneSignal (via utilities)

**Quick Start**
1. Install dependencies: `npm install`
2. Create `config.env` from the example: `Copy-Item config.env.example config.env`
3. Update environment values in `config.env`
4. Start the API: `npm run dev`

**Environment Variables**
The app loads variables from `config.env`.

| Name | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | HTTP port (example: `8000`) |
| `BASE_URL` | Yes | Base URL for public links |
| `DB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET_KEY` | Yes | JWT signing secret |
| `JWT_EXPIRES_IN` | Yes | JWT lifetime (example: `90d`) |
| `EMAIL_USERNAME` | Optional | SMTP username |
| `EMAIL_PASSWORD` | Optional | SMTP password or app password |
| `EMAIL_HOST` | Optional | SMTP host |
| `EMAIL_PORT` | Optional | SMTP port |
| `STRIPE_SECRET_KEY` | Optional | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook secret |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API secret |
| `OPENROUTER_API_KEY` | Optional | AI recommendation provider key |
| `CHANNEL_SYNC_TIMEOUT_MS` | Optional | Timeout for channel-provider sync requests |

**Scripts**
- `npm run dev` starts the server with nodemon
- `npm start` starts the server in production mode

**API Documentation**
See `docs/API.md` for full endpoint reference, examples, and auth details.

**Channel Management**
- `GET /api/v1/channel-management/providers` lists the supported provider codes.
- `GET /api/v1/channel-management/connection` returns the current hotel connection.
- `PUT /api/v1/channel-management/connection` saves provider settings, credentials, field mapping, and room mapping.
- `POST /api/v1/channel-management/sync` pulls reservations from the configured provider endpoint, or accepts a `reservations` array in the request body.
- `POST /api/v1/channel-management/import` imports a normalized `reservations` array manually.

Example connection payload:
```json
{
  "provider": "siteminder",
  "connectionMode": "api",
  "baseUrl": "https://your-middleware.example.com",
  "reservationsPath": "/reservations",
  "authType": "bearer",
  "credentials": {
    "token": "provider-token"
  },
  "propertyId": "hotel-123",
  "defaultRate": 120,
  "roomMap": [
    { "externalRoomId": "DLX-01", "localRoomNumber": "101" },
    { "externalRoomId": "DLX-02", "localRoomNumber": "102" }
  ]
}
```

Example manual import payload:
```json
{
  "reservations": [
    {
      "externalReservationId": "BK-10001",
      "guest": { "firstName": "John", "lastName": "Doe" },
      "checkIn": "2026-04-10",
      "checkOut": "2026-04-12",
      "roomIds": ["DLX-01"],
      "totalAmount": 240,
      "paidAmount": 100,
      "status": "confirmed"
    }
  ]
}
```
