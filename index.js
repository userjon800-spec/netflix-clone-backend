require("dotenv").config();
require("./config/google.strategy");
require("./config/github.strategy");
const express = require("express");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const router = require("./routes/auth.route");
const userRoute = require("./routes/user.route");
const adminRoute = require("./routes/admin.route");
const errorMiddleware = require("./middleware/error.middleware");
const loggerMiddleware = require("./middleware/logger.middleware");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 7800;

app.use(loggerMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  process.env.PRIVATE_CLIENT_URL,
  "http://localhost:3000",
  "https://netflix-clone-javohir.vercel.app",
].filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true);
    },
  }),
);

let cachedDb = null;
let lastDbError = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    lastDbError = null;
    return mongoose.connection;
  }
  try {
    if (!process.env.MONGO_URL) {
      const msg = "Xatolik: MONGO_URL muhit o'zgaruvchisi topilmadi!";
      console.error("❌ " + msg);
      lastDbError = { message: msg, time: new Date().toISOString() };
      return null;
    }
    cachedDb = await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDb muvaffaqiyatli ishga tushdi");
    lastDbError = null;
    return cachedDb;
  } catch (err) {
    lastDbError = {
      message: err.message,
      name: err.name,
      time: new Date().toISOString(),
    };
    console.error("❌ MongoDB ulanishda xatolik:", err.message);
    return null;
  }
};

// Dastlabki ulanish
connectDB();

app.get("/health", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  const isDbConnected = mongoose.connection.readyState === 1;
  const rawUrl = process.env.MONGO_URL || "";
  const hostPart = rawUrl.includes("@")
    ? rawUrl.split("@")[1].split("?")[0]
    : rawUrl.slice(0, 20) || "NOT_SET";

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "ok" : "db_disconnected",
    dbStatus: isDbConnected ? "Connected" : "Disconnected",
    dbReadyState: mongoose.connection.readyState,
    hasMongoUrl: Boolean(process.env.MONGO_URL),
    targetCluster: hostPart,
    lastDbError: lastDbError,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Har bir so'rovda DB ulanishi tayyorligini ta'minlash (Serverless / Cold-start timeoutlaridan himoya)
app.use(async (req, res, next) => {
  if (req.path === "/health") return next();
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

app.use("/api", router);
app.use("/api", userRoute);
app.use("/api", adminRoute);

// Markaziy xatoliklarni ushlaydigan middleware
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
});

module.exports = app;
