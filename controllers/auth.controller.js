const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "email va password majburiy" });
      }
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Email yoki parol xato" });
      }
      const itsPass = await bcrypt.compare(password, user.password);
      if (!itsPass) {
        return res.status(500).json({ message: "Parol xato kirildi" });
      }
      const payload = { id: user._id, email: user.email };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });
      res.status(200).json({ message: "Muvaffaqiyatli login", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ message: "name, email, password majburiy" });
      }
      const hashPass = await bcrypt.hash(String(password), 10);
      const user = await userModel.create({ name, email, password: hashPass });
      if (!user) {
        return res.status(401).json({ message: "Email yoki parol xato" });
      }
      const payload = { id: user._id, email: user.email };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });
      res
        .status(200)
        .json({ message: "Ro'yxatdan muvaffaqiyatli o'tdingiz", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async me(req, res) {
    try {
      const token = req.cookies?.token;
      if (!token) return res.status(401).json({ message: "Unauthorized" });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      return res.status(200).json({ user });
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  logout(req, res) {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({ message: "Logged out" });
  }
}
module.exports = new AuthController();