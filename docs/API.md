# API Reference

**Base URL**
`http://localhost:8000/api/v1`

The server uses `PORT` and `BASE_URL` from `config.env`. Update these for your environment.

**Authentication**
All routes are protected unless stated otherwise. Use a JWT access token in the `Authorization` header.

`Authorization: Bearer <token>`

**Content Types**
- JSON for most requests
- `multipart/form-data` for file uploads

**Error Responses**
In production, errors return:

```json
{
  "status": "error",
  "message": "..."
}
```

In development, errors include `stack` and the full error object.

**File Uploads**
The following endpoints accept file uploads:
- `POST /auth/signup` accepts `Licensing`, `taxCard`, `CommercialRegister`
- `POST /hotels` accepts `Licensing`, `taxCard`, `CommercialRegister`

Example:

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: multipart/form-data" \
  -F "userName=John Doe" \
  -F "email=john@example.com" \
  -F "password=secret123" \
  -F "hotelName=My Hotel" \
  -F "location=Cairo" \
  -F "Licensing=@/path/licensing.pdf"
```

**Public Endpoints**

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/signup` | Create a user and hotel, returns token |
| POST | `/auth/login` | Login, returns token |
| POST | `/auth/forgotPassword` | Send password reset code |
| POST | `/auth/verifyResetCode` | Verify password reset code |
| PUT | `/auth/resetPassword` | Reset password after verification |

**Auth Examples**

**POST /auth/signup**

Request:

```json
{
  "userName": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "admin",
  "hotelName": "My Hotel",
  "location": "Cairo",
  "totalRooms": 100,
  "totalOnwers": 2,
  "services": "Spa, Gym"
}
```

Response:

```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "_id": "64f...",
    "userName": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "hotel": "64f..."
  },
  "hotel": {
    "_id": "64f...",
    "hotelName": "My Hotel",
    "location": "Cairo",
    "email": "john@example.com",
    "totalRooms": 100,
    "totalOwners": 2
  }
}
```

**POST /auth/login**

Request:

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

Response:

```json
{
  "status": "true",
  "token": "<jwt>"
}
```

**POST /auth/forgotPassword**

Request:

```json
{
  "email": "john@example.com"
}
```

Response:

```json
{
  "status": "Success",
  "message": "Reset code sent to email"
}
```

**POST /auth/verifyResetCode**

Request:

```json
{
  "resetCode": "123456"
}
```

Response:

```json
{
  "status": "Success"
}
```

**PUT /auth/resetPassword**

Request:

```json
{
  "email": "john@example.com",
  "newPassword": "newSecret123"
}
```

Response:

```json
{
  "token": "<jwt>"
}
```

**Users**
Base path: `/users`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/getMe` | Get current user profile |
| PUT | `/changeMyPassword` | Update current user password |
| PUT | `/updateMe` | Update current user profile |
| DELETE | `/deleteMe` | Delete current user |
| PUT | `/changePassword/:id` | Admin change password for user |
| GET | `/` | List users |
| POST | `/` | Create user (with optional image) |
| GET | `/:id` | Get user by id |
| PUT | `/:id` | Update user by id |
| DELETE | `/:id` | Delete user by id |

**Users Examples**

**GET /users/getMe**

Response:

```json
{
  "data": {
    "_id": "64f...",
    "userName": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "hotel": "64f..."
  }
}
```

**PUT /users/changeMyPassword**

Request:

```json
{
  "password": "newSecret123"
}
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "userName": "John Doe"
  },
  "token": "<jwt>"
}
```

**PUT /users/updateMe**

Request:

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "+201000000000"
}
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "name": "John Updated",
    "email": "john.updated@example.com",
    "phone": "+201000000000"
  }
}
```

**DELETE /users/deleteMe**

Response:

```json
{
  "status": "Success"
}
```

**PUT /users/changePassword/:id**

Request:

```json
{
  "currentPassword": "oldSecret123",
  "password": "newSecret123",
  "passwordConfirm": "newSecret123"
}
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "userName": "John Doe"
  }
}
```

**GET /users**

Response:

```json
{
  "results": 1,
  "paginationResult": {
    "currentPage": 1,
    "limit": 50,
    "numberOfPages": 1
  },
  "data": [
    {
      "_id": "64f...",
      "userName": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    }
  ]
}
```

**POST /users**

Request:

```json
{
  "userName": "Jane",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "manager",
  "phone": "+201000000001"
}
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "userName": "Jane",
    "email": "jane@example.com",
    "role": "manager",
    "hotel": "64f..."
  }
}
```

**GET /users/:id**

Response:

```json
{
  "data": {
    "_id": "64f...",
    "userName": "Jane",
    "email": "jane@example.com",
    "role": "manager"
  }
}
```

**PUT /users/:id**

Request:

```json
{
  "userName": "Jane Updated",
  "email": "jane.updated@example.com",
  "phone": "+201000000002",
  "role": "manager"
}
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "userName": "Jane Updated",
    "email": "jane.updated@example.com",
    "role": "manager"
  }
}
```

**DELETE /users/:id**

Response:

```json
null
```

**Hotels**
Base path: `/hotels`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/` | Create hotel (supports document uploads) |
| GET | `/` | List hotels |
| GET | `/:id` | Get hotel by id |
| PUT | `/:id` | Update hotel by id |
| DELETE | `/:id` | Delete hotel by id |
| GET | `/:id/subscription-status` | Check subscription status |

**Hotels Examples**

**POST /hotels**

Request:

```json
{
  "hotelName": "My Hotel",
  "location": "Cairo",
  "email": "hotel@example.com",
  "phoneNumber": "+201000000000",
  "totalRooms": 100,
  "totalOwners": 2,
  "owner": "64f..."
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "_id": "64f...",
    "hotelName": "My Hotel",
    "location": "Cairo",
    "email": "hotel@example.com",
    "totalRooms": 100,
    "totalOwners": 2
  }
}
```

**GET /hotels**

Response:

```json
{
  "results": 1,
  "data": [
    {
      "_id": "64f...",
      "hotelName": "My Hotel",
      "location": "Cairo"
    }
  ]
}
```

**GET /hotels/:id**

Response:

```json
{
  "data": {
    "_id": "64f...",
    "hotelName": "My Hotel",
    "location": "Cairo"
  }
}
```

**PUT /hotels/:id**

Request:

```json
{
  "phoneNumber": "+201000000000",
  "startAt": "2026-03-11",
  "endAt": "2027-03-11"
}
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "phoneNumber": "+201000000000",
    "startAt": "2026-03-11T00:00:00.000Z",
    "endAt": "2027-03-11T00:00:00.000Z"
  }
}
```

**DELETE /hotels/:id**

Response:

```json
null
```

**GET /hotels/:id/subscription-status**

Response:

```json
{
  "status": "success",
  "isActiveSubscription": false
}
```

**Rooms**
Base path: `/rooms`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/` | Create room |
| GET | `/` | List rooms |
| GET | `/:id` | Get room by id |
| PUT | `/:id` | Update room by id |
| DELETE | `/:id` | Delete room by id |

**Rooms Examples**

**POST /rooms**

Request:

```json
{
  "roomNumber": "101",
  "category": "64f...",
  "type": "64f...",
  "maxGuests": 2,
  "MaxChildren": 1,
  "view": "sea",
  "status": "available",
  "floor": 1,
  "hotel": "64f..."
}
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "roomNumber": "101",
    "category": "Deluxe",
    "type": "Double",
    "maxGuests": 2,
    "status": "available"
  }
}
```

**GET /rooms**

Response:

```json
{
  "results": 1,
  "data": [
    {
      "_id": "64f...",
      "roomNumber": "101",
      "category": "Deluxe",
      "type": "Double",
      "status": "available"
    }
  ]
}
```

**GET /rooms/:id**

Response:

```json
{
  "data": {
    "_id": "64f...",
    "roomNumber": "101",
    "status": "available"
  }
}
```

**PUT /rooms/:id**

Request:

```json
{
  "status": "maintenance",
  "floor": 2
}
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "status": "maintenance",
    "floor": 2
  }
}
```

**DELETE /rooms/:id**

Response:

```json
null
```

**Room Categories**
Base path: `/roomCategory`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/` | Create room category |
| GET | `/` | List room categories |
| GET | `/:id` | Get room category by id |
| PUT | `/:id` | Update room category by id |
| DELETE | `/:id` | Delete room category by id |

**Room Categories Examples**

**POST /roomCategory**

Request:

```json
{
  "name": "Deluxe",
  "hotel": "64f..."
}
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "name": "Deluxe"
  }
}
```

**GET /roomCategory**

Response:

```json
{
  "results": 1,
  "data": [
    { "_id": "64f...", "name": "Deluxe" }
  ]
}
```

**GET /roomCategory/:id**

Response:

```json
{
  "data": { "_id": "64f...", "name": "Deluxe" }
}
```

**PUT /roomCategory/:id**

Request:

```json
{ "name": "Premium" }
```

Response:

```json
{
  "data": { "_id": "64f...", "name": "Premium" }
}
```

**DELETE /roomCategory/:id**

Response:

```json
null
```

**Room Types**
Base path: `/roomType`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/` | Create room type |
| GET | `/` | List room types |
| GET | `/:id` | Get room type by id |
| PUT | `/:id` | Update room type by id |
| DELETE | `/:id` | Delete room type by id |

**Room Types Examples**

**POST /roomType**

Request:

```json
{
  "name": "Double",
  "hotel": "64f..."
}
```

Response:

```json
{
  "data": { "_id": "64f...", "name": "Double" }
}
```

**GET /roomType**

Response:

```json
{
  "results": 1,
  "data": [
    { "_id": "64f...", "name": "Double" }
  ]
}
```

**GET /roomType/:id**

Response:

```json
{
  "data": { "_id": "64f...", "name": "Double" }
}
```

**PUT /roomType/:id**

Request:

```json
{ "name": "King" }
```

Response:

```json
{
  "data": { "_id": "64f...", "name": "King" }
}
```

**DELETE /roomType/:id**

Response:

```json
null
```

**Pricing**
Base path: `/pricing`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/` | Create pricing |
| GET | `/` | List pricing |
| GET | `/:id` | Get pricing by id |
| PUT | `/:id` | Update pricing by id |
| DELETE | `/:id` | Delete pricing by id |

**Pricing Examples**

**POST /pricing**

Request:

```json
{
  "name": "Standard",
  "price": 120,
  "hotel": "64f..."
}
```

Response:

```json
{
  "data": { "_id": "64f...", "name": "Standard", "price": 120 }
}
```

**GET /pricing**

Response:

```json
{
  "results": 1,
  "data": [
    { "_id": "64f...", "name": "Standard", "price": 120 }
  ]
}
```

**GET /pricing/:id**

Response:

```json
{
  "data": { "_id": "64f...", "name": "Standard", "price": 120 }
}
```

**PUT /pricing/:id**

Request:

```json
{ "price": 140 }
```

Response:

```json
{
  "data": { "_id": "64f...", "name": "Standard", "price": 140 }
}
```

**DELETE /pricing/:id**

Response:

```json
null
```

**Packages**
Base path: `/packages`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/` | Create package |
| GET | `/` | List packages |
| GET | `/:id` | Get package by id |
| PUT | `/:id` | Update package by id |
| DELETE | `/:id` | Delete package by id |

**Packages Examples**

**POST /packages**

Request:

```json
{
  "name": "Honeymoon",
  "price": 50,
  "hotel": "64f..."
}
```

Response:

```json
{
  "data": { "_id": "64f...", "name": "Honeymoon", "price": 50 }
}
```

**GET /packages**

Response:

```json
{
  "results": 1,
  "data": [
    { "_id": "64f...", "name": "Honeymoon", "price": 50 }
  ]
}
```

**GET /packages/:id**

Response:

```json
{
  "data": { "_id": "64f...", "name": "Honeymoon", "price": 50 }
}
```

**PUT /packages/:id**

Request:

```json
{ "price": 60 }
```

Response:

```json
{
  "data": { "_id": "64f...", "name": "Honeymoon", "price": 60 }
}
```

**DELETE /packages/:id**

Response:

```json
null
```

**Services**
Base path: `/services`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/` | Create service |
| GET | `/` | List services |
| GET | `/:id` | Get service by id |
| PUT | `/:id` | Update service by id |
| DELETE | `/:id` | Delete service by id |

**Services Examples**

**POST /services**

Request:

```json
{
  "name": "Airport Pickup",
  "price": 30,
  "hotel": "64f..."
}
```

Response:

```json
{
  "data": { "_id": "64f...", "name": "Airport Pickup", "price": 30 }
}
```

**GET /services**

Response:

```json
{
  "results": 1,
  "data": [
    { "_id": "64f...", "name": "Airport Pickup", "price": 30 }
  ]
}
```

**GET /services/:id**

Response:

```json
{
  "data": { "_id": "64f...", "name": "Airport Pickup", "price": 30 }
}
```

**PUT /services/:id**

Request:

```json
{ "price": 35 }
```

Response:

```json
{
  "data": { "_id": "64f...", "name": "Airport Pickup", "price": 35 }
}
```

**DELETE /services/:id**

Response:

```json
null
```

**Reservations**
Base path: `/reservation`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/` | Create reservation |
| GET | `/` | List reservations for hotel |
| GET | `/available/rooms` | List available rooms |
| GET | `/:id` | Get reservation by id |
| PUT | `/:id` | Update reservation |
| DELETE | `/:id` | Delete reservation |

**Reservations Examples**

**POST /reservation**

Request:

```json
{
  "mainGuest": {
    "firstName": "Ali",
    "lastName": "Hassan",
    "age": 30,
    "nationality": "EG",
    "idNumber": "A1234567"
  },
  "additionalGuests": [
    { "firstName": "Sara", "lastName": "Hassan", "age": 28 }
  ],
  "rooms": [
    { "room": "64f...", "perDay": 120, "package": "64f..." }
  ],
  "services": ["64f..."],
  "packages": ["64f..."],
  "payments": [
    { "amount": 100, "method": "cash" }
  ],
  "status": "confirmed",
  "checkIn": "2026-03-20",
  "checkOut": "2026-03-23",
  "travelAgent": "64f...",
  "alerts": ["VIP"]
}
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "mainGuest": { "firstName": "Ali", "lastName": "Hassan" },
    "rooms": [
      { "room": "64f...", "perDay": 120, "nights": 3, "total": 360 }
    ],
    "totalAmount": 390,
    "paidAmount": 100,
    "remainingAmount": 290,
    "status": "confirmed",
    "stayStatus": "reserved"
  }
}
```

**GET /reservation**

Example query: `?status=confirmed&fromDate=2026-03-01&toDate=2026-03-31&page=1&limit=10`

Response:

```json
{
  "success": true,
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "data": [
    {
      "confirmationNumber": "64f...",
      "mainGuestName": "Ali Hassan",
      "travelAgent": "-",
      "roomsCount": 1,
      "arriveDate": "2026-03-20T00:00:00.000Z",
      "departDate": "2026-03-23T00:00:00.000Z",
      "reservedNights": 3,
      "status": "confirmed",
      "stayStatus": "reserved"
    }
  ]
}
```

**GET /reservation/available/rooms**

Example query: `?checkIn=2026-03-20&checkOut=2026-03-23&maxGuests=2&type=64f...`

Response:

```json
{
  "status": "success",
  "results": 1,
  "data": [
    {
      "_id": "64f...",
      "roomNumber": "101",
      "status": "available"
    }
  ]
}
```

**GET /reservation/:id**

Response:

```json
{
  "data": {
    "_id": "64f...",
    "mainGuest": { "firstName": "Ali", "lastName": "Hassan" },
    "status": "confirmed",
    "stayStatus": "reserved"
  }
}
```

**PUT /reservation/:id**

Request:

```json
{
  "mainGuest": { "firstName": "Ali", "lastName": "Hassan" },
  "rooms": [
    { "room": "64f...", "nights": 2, "perDay": 130 }
  ],
  "services": ["64f..."],
  "payments": [
    { "amount": 200, "method": "card" }
  ],
  "status": "confirmed",
  "checkIn": "2026-03-21",
  "checkOut": "2026-03-23"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "_id": "64f...",
    "status": "confirmed",
    "stayStatus": "reserved",
    "totalAmount": 260,
    "paidAmount": 200,
    "remainingAmount": 60
  }
}
```

**DELETE /reservation/:id**

Response:

```json
null
```

**Dashboard**
Base path: `/dashboard`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/overview` | Get dashboard overview |

**Dashboard Example**

**GET /dashboard/overview**

Response:

```json
{
  "arrival": 3,
  "departure": 2,
  "inHouse": 5,
  "avilableRooms": 20,
  "occupiedRooms": 10,
  "rooms": [
    {
      "name": "Deluxe",
      "types": [
        { "name": "Double", "value": 6 },
        { "name": "King", "value": 4 }
      ]
    }
  ],
  "arrivals": [
    {
      "roomNumber": "101",
      "name": "Ali Hassan",
      "bookedNights": 3,
      "total": 360,
      "paid": 100
    }
  ],
  "departuers": [
    {
      "roomNumber": "102",
      "name": "Sara Ali",
      "bookedNights": 2,
      "total": 240,
      "paid": 240
    }
  ]
}
```

**Front Office**
Base path: `/front-office`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/arrivals` | Upcoming arrivals |
| GET | `/departures` | Departures |
| GET | `/inhouse` | In-house guests |
| GET | `/noshow` | No-show list |
| POST | `/recommendation` | Front desk recommendation |
| POST | `/manager-recommendation` | Manager recommendation |
| PATCH | `/:id/check-in` | Check in a reservation |
| PATCH | `/:id/check-out` | Check out a reservation |

**Front Office Examples**

**GET /front-office/arrivals**

Response:

```json
{
  "status": "success",
  "count": 1,
  "data": [
    {
      "confirmationNumber": "64f...",
      "mainGuestName": "Ali Hassan",
      "travelAgent": "N/A",
      "roomsCount": 1,
      "arriveDate": "20/03/2026",
      "reservedNights": 3
    }
  ]
}
```

**GET /front-office/departures**

Response:

```json
{
  "count": 1,
  "data": [
    {
      "confirmationNumber": "64f...",
      "mainGuestName": "Ali Hassan",
      "roomsCount": 1,
      "reservedNights": 3,
      "remaining": 0,
      "departureDate": "23/03/2026"
    }
  ]
}
```

**GET /front-office/inhouse**

Response:

```json
{
  "count": 1,
  "data": [
    {
      "confirmationNumber": "64f...",
      "mainGuestName": "Ali Hassan",
      "roomsCount": 1,
      "reservedNights": 3,
      "remaining": 50,
      "departureDate": "23/03/2026"
    }
  ]
}
```

**GET /front-office/noshow**

Response:

```json
{
  "count": 1,
  "data": [
    {
      "confirmationNumber": "64f...",
      "mainGuestName": "Ali Hassan",
      "roomsCount": 1,
      "reservedNights": 2,
      "total": 240,
      "paid": 0,
      "arrivalDate": "18/03/2026"
    }
  ]
}
```

**POST /front-office/recommendation**

Response:

```json
{
  "status": "success",
  "hotelId": "64f...",
  "recommendation": "Offer late checkout to increase satisfaction and upsell breakfast package."
}
```

**POST /front-office/manager-recommendation**

Response:

```json
{
  "status": "success",
  "hotelId": "64f...",
  "role": "manager",
  "recommendation": "Track ADR daily and optimize weekend rates to lift RevPAR."
}
```

**PATCH /front-office/:id/check-in**

Response:

```json
{
  "message": "Checked in successfully",
  "reservation": {
    "_id": "64f...",
    "stayStatus": "checked-in",
    "status": "confirmed"
  }
}
```

**PATCH /front-office/:id/check-out**

Response:

```json
{
  "message": "Checked out successfully",
  "reservation": {
    "_id": "64f...",
    "stayStatus": "checked-out",
    "status": "completed"
  }
}
```

**Inventory**
Base path: `/inventory`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/out-of-service` | Rooms out of service |
| GET | `/house-keeping` | Rooms in housekeeping |
| PATCH | `/finish/:id` | Finish room status |
| PATCH | `/housekeeping/:roomNumber` | Set room to housekeeping |
| PATCH | `/out-of-service/:roomNumber` | Set room out of service |

**Inventory Examples**

**GET /inventory/out-of-service**

Response:

```json
{
  "results": 1,
  "data": [
    { "_id": "64f...", "roomNumber": "101", "status": "maintenance" }
  ]
}
```

**GET /inventory/house-keeping**

Response:

```json
{
  "results": 1,
  "data": [
    { "_id": "64f...", "roomNumber": "102", "status": "cleaning" }
  ]
}
```

**PATCH /inventory/finish/:id**

Response:

```json
{
  "data": { "_id": "64f...", "roomNumber": "101", "status": "available" }
}
```

**PATCH /inventory/housekeeping/:roomNumber**

Response:

```json
{
  "data": { "_id": "64f...", "roomNumber": "101", "status": "cleaning" }
}
```

**PATCH /inventory/out-of-service/:roomNumber**

Response:

```json
{
  "data": { "_id": "64f...", "roomNumber": "101", "status": "maintenance" }
}
```

**Travel Agents**
Base path: `/travel-agents`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/` | Create travel agent |
| GET | `/` | List travel agents |
| GET | `/:id` | Get travel agent by id |
| PATCH | `/:id` | Update travel agent |
| DELETE | `/:id` | Delete travel agent |

**Travel Agents Examples**

**POST /travel-agents**

Request:

```json
{ "name": "Golden Travel" }
```

Response:

```json
{
  "status": "success",
  "data": { "_id": "64f...", "name": "Golden Travel" }
}
```

**GET /travel-agents**

Response:

```json
{
  "status": "success",
  "results": 1,
  "data": [
    { "_id": "64f...", "name": "Golden Travel" }
  ]
}
```

**GET /travel-agents/:id**

Response:

```json
{
  "status": "success",
  "data": { "_id": "64f...", "name": "Golden Travel" }
}
```

**PATCH /travel-agents/:id**

Request:

```json
{ "name": "Golden Travel Co" }
```

Response:

```json
{
  "status": "success",
  "data": { "_id": "64f...", "name": "Golden Travel Co" }
}
```

**DELETE /travel-agents/:id**

Response:

```json
{
  "status": "success",
  "data": null
}
```

**Reports**
Base path: `/reports`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/expected-arrivals` | Expected arrivals report |
| GET | `/in-house` | In-house guests report |
| GET | `/reservation-ledger` | Reservation ledger report |
| GET | `/no-show-cancel` | No-show and cancellations report |
| GET | `/police` | Police report |
| GET | `/room-status` | Room status report |
| GET | `/night-audit` | Night audit report |
| GET | `/manager-flash` | Manager flash report |
| GET | `/folio-history` | Folio history report |
| GET | `/cashier` | Cashier report |

**Reports Examples**

**GET /reports/expected-arrivals**

Example query: `?fromDate=2026-03-01&toDate=2026-03-31`

Response:

```json
{
  "status": "success",
  "results": 1,
  "data": [
    {
      "guestName": "Ali Hassan",
      "reservationNumber": "64f...",
      "bookingSource": "Direct",
      "expectedArrival": "2026-03-20T00:00:00.000Z",
      "remainingAmount": 290,
      "roomType": "101",
      "vipNotes": "VIP"
    }
  ]
}
```

**GET /reports/in-house**

Response:

```json
{
  "status": "success",
  "results": 1,
  "data": [
    {
      "guestName": "Ali Hassan",
      "roomNumber": "101",
      "idNumber": "A1234567",
      "nationality": "EG",
      "arrivalDate": "2026-03-20T00:00:00.000Z",
      "departureDate": "2026-03-23T00:00:00.000Z",
      "paidAmount": 100
    }
  ]
}
```

**GET /reports/reservation-ledger**

Response:

```json
{
  "status": "success",
  "results": 1,
  "data": [
    {
      "reservationNumber": "64f...",
      "guestName": "Ali Hassan",
      "status": "confirmed",
      "stayStatus": "reserved",
      "remainingAmount": 290,
      "nights": 3,
      "bookingSource": "Direct"
    }
  ]
}
```

**GET /reports/no-show-cancel**

Response:

```json
{
  "status": "success",
  "results": 1,
  "data": [
    {
      "reservationNumber": "64f...",
      "guestName": "Ali Hassan",
      "checkIn": "2026-03-18T00:00:00.000Z",
      "status": "canceled",
      "stayStatus": "reserved",
      "lostRevenue": 0
    }
  ]
}
```

**GET /reports/police**

Response:

```json
{
  "status": "success",
  "results": 1,
  "data": [
    {
      "fullName": "Ali Hassan",
      "nationality": "EG",
      "idNumber": "A1234567",
      "roomNumber": "101",
      "arrivalDate": "2026-03-20T00:00:00.000Z",
      "departureDate": "2026-03-23T00:00:00.000Z"
    }
  ]
}
```

**GET /reports/room-status**

Response:

```json
{
  "status": "success",
  "results": 1,
  "data": [
    {
      "roomNumber": "101",
      "statusCode": "VC",
      "lastUpdated": "2026-03-11T10:00:00.000Z",
      "floor": 1
    }
  ]
}
```

**GET /reports/night-audit**

Response:

```json
{
  "status": "success",
  "data": {
    "date": "2026-03-11T00:00:00.000Z",
    "totalReservations": 4,
    "roomRevenue": 1200,
    "taxes": 168,
    "netRevenue": 1032
  }
}
```

**GET /reports/manager-flash**

Example query: `?date=2026-03-11`

Response:

```json
{
  "status": "success",
  "data": {
    "date": "2026-03-11T00:00:00.000Z",
    "roomsAvailable": 50,
    "roomsSold": 30,
    "totalRoomRevenue": 3600,
    "occupancy": 60,
    "ADR": 120,
    "RevPAR": 72
  }
}
```

**GET /reports/folio-history**

Example query: `?fromDate=2026-03-01&toDate=2026-03-31&status=confirmed`

Response:

```json
{
  "status": "success",
  "hotel": "64f...",
  "results": 1,
  "summary": {
    "totalRevenue": 390,
    "totalPaid": 100,
    "totalRemaining": 290
  },
  "data": [
    {
      "reservationId": "64f...",
      "guest": "Ali Hassan",
      "rooms": [
        { "roomNumber": "101", "nights": 3, "perDay": 120, "total": 360 }
      ],
      "stayStatus": "reserved",
      "reservationStatus": "confirmed",
      "checkIn": "2026-03-20T00:00:00.000Z",
      "checkOut": "2026-03-23T00:00:00.000Z",
      "totalAmount": 390,
      "paidAmount": 100,
      "remainingAmount": 290,
      "payments": [
        { "amount": 100, "method": "cash", "date": "2026-03-11T00:00:00.000Z" }
      ],
      "travelAgent": null,
      "createdAt": "2026-03-11T00:00:00.000Z"
    }
  ]
}
```

**GET /reports/cashier**

Example query: `?fromDate=2026-03-01&toDate=2026-03-31&method=cash`

Response:

```json
{
  "status": "success",
  "hotel": "64f...",
  "summary": {
    "grandTotal": 390,
    "totalCash": 390,
    "breakdown": [
      { "_id": "cash", "totalAmount": 390, "transactions": 1 }
    ]
  }
}
```

**Room Diary**
Base path: `/room-diary`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Room diary for the current hotel |

**Room Diary Example**

**GET /room-diary**

Response:

```json
{
  "from": "2026-03-11T00:00:00.000Z",
  "to": "2026-03-16T23:59:59.999Z",
  "totalRooms": 1,
  "totalDays": 6,
  "data": [
    {
      "roomId": "64f...",
      "roomNumber": "101",
      "floor": 1,
      "roomStatus": "available",
      "days": [
        {
          "date": "2026-03-11",
          "status": "available",
          "type": "empty"
        }
      ]
    }
  ]
}
```

**Settings**
Base path: `/settings`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/terms` | Get terms |
| POST | `/terms` | Create terms |
| PUT | `/terms` | Update terms |

**Settings Examples**

**GET /settings/terms**

Response:

```json
{
  "data": { "printTerms": "" }
}
```

**POST /settings/terms**

Request:

```json
{ "printTerms": "Check-in time is 2 PM." }
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "hotel": "64f...",
    "printTerms": "Check-in time is 2 PM."
  }
}
```

**PUT /settings/terms**

Request:

```json
{ "printTerms": "Updated terms text." }
```

Response:

```json
{
  "data": {
    "_id": "64f...",
    "hotel": "64f...",
    "printTerms": "Updated terms text."
  }
}
```

**Notes**
- Notification route exists in `routes/notifcationRoute.js` but is not mounted in `server.js`.
- Some endpoints assume `req.user.hotel` from the JWT token.
