require("dotenv").config();
const express = require("express");
const cookieParser =  require("cookie-parser")
const router = require("./routes/auth.route");
const { default: mongoose } = require("mongoose");
const app = express();
const cors = require("cors")
const PORT = process.env.PORT || 7800;
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  credentials: true,
  origin: 'http://localhost:3000'
}))
app.use("/api", router);  
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDb ishga tushdi"))
  .catch(() => console.error("Xatolik"));
app.listen(PORT, () => {
  console.log(`Server ${PORT} ishga tushdi`);
});