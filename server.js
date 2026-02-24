const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

dotenv.config({ path: 'config.env' });
const ApiError = require('./utils/apiError');
const globalError = require('./middlewares/errorMiddleware');
const dbConnection = require('./config/database');

// Routes
const userRoute = require('./routes/userRoute');
const authRoute=require('./routes/authRoute')
const hotelRoute=require('./routes/hotelRoute')
const roomRoute=require('./routes/roomRoute')
const roomCategory=require('./routes/roomCategoryRoute')
const roomType=require('./routes/roomTypeRoute')
const pricingRoute = require("./routes/roomPricingRoute");
const packagesRoute = require('./routes/roomPackagesRoute');
const servicesRoute = require('./routes/roomServicesRoute');
const reservationRoute = require('./routes/reservationRoutes');
const dashboardRoutes=require('./routes/dashboardRoutes.js');
const frontOffice=require('./routes/frontOficeRoute.js')
const inventoryRoute=require('./routes/inventoryRoute')
const travelAgentRoutes = require("./routes/travelAgentRoutes");
const reportsRoute = require("./routes/reportRoutes");
const roomDiaryRoute = require("./routes/roomDiaryRoute");




// Connect with db
 dbConnection();

// express app
const app = express();


//////////////////////////


// Enable other domains to access your application
app.use(cors());
app.options('*', cors());

// compress all responses
app.use(compression());


// Middlewares
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

// Limit each IP to 100 requests per `window` (here, per 15 minutes)
//const limiter = rateLimit({
//  windowMs: 15 * 60 * 1000, // 15 minutes
//  max: 100,
//  message:
//    'Too many accounts created from this IP, please try again after an hour',
//});

// Apply the rate limiting middleware to all requests
//app.use('/api', limiter);
app.use((req, res, next) => {
  console.log("\n================= INCOMING REQUEST =================");
  console.log("Time:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("IP:", req.headers["x-forwarded-for"] || req.socket.remoteAddress);
  console.log("Query:", req.query);
  console.log("Params:", req.params);
  console.log("Body:", req.body);

  console.log("Headers:", {
    "user-agent": req.headers["user-agent"],
    authorization: req.headers.authorization ? "[PROVIDED]" : "[NONE]"
  });

  console.log("====================================================\n");
  next();
});

// Mount Routes
app.use('/api/v1/auth',authRoute)
app.use('/api/v1/users', userRoute);
app.use('/api/v1/hotels', hotelRoute);
app.use('/api/v1/rooms', roomRoute);
app.use('/api/v1/roomCategory', roomCategory);
app.use('/api/v1/roomType', roomType);
app.use("/api/v1/pricing", pricingRoute);
app.use('/api/v1/packages', packagesRoute);
app.use('/api/v1/services', servicesRoute);
app.use('/api/v1/reservation', reservationRoute);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/front-office", frontOffice);
app.use('/api/v1/inventory',inventoryRoute);
app.use("/api/v1/travel-agents", travelAgentRoutes);
app.use("/api/v1/reports", reportsRoute);
app.use('/api/v1/room-diary', roomDiaryRoute);
//api/v1/reports/expected-arrivals

app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware for express
app.use(globalError);

////////////////////////////

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(`App running running on port ${PORT}`);
});

// Handle rejection outside express
process.on('unhandledRejection', (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`Shutting down....`);
    process.exit(1);
  });
});
