require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const router = require("./routes/auth.route");
const userRoute = require("./routes/user.route");
const { mongoose } = require("mongoose");
require("./config/google.strategy");
require("./config/github.strategy");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 7800;
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  }),
);
app.use("/api", router);
app.use("/api", userRoute);
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDb ishga tushdi"))
  .catch((err) => console.error("Xatolik", err));
app.listen(PORT, () => {
  console.log(`Server ${PORT} ishga tushdi`);
});