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

app.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "ok" : "db_disconnected",
    dbStatus: isDbConnected ? "Connected" : "Disconnected",
    dbReadyState: mongoose.connection.readyState,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", router);
app.use("/api", userRoute);
app.use("/api", adminRoute);

// Markaziy xatoliklarni ushlaydigan middleware
app.use(errorMiddleware);

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      console.error("❌ Xatolik: .env faylida MONGO_URL aniqlanmagan!");
      return;
    }
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("✅ MongoDb muvaffaqiyatli ishga tushdi");
  } catch (err) {
    console.error("❌ MongoDB ulanishda xatolik:", err.message);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
});
