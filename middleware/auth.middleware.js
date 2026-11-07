const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const userModel = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Token topilmadi, iltimos tizimga kiring" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminEmail = process.env.ADMIN_GMAIL?.trim().toLowerCase();

    // 1. Agar token maxsus .env Admin yoki role "admin" ga tegishli bo'lsa
    if (
      decoded.id === "admin" ||
      (adminEmail && decoded.email?.toLowerCase() === adminEmail)
    ) {
      req.user = {
        id: decoded.id || "admin",
        role: "admin",
        isBanned: false,
        email: decoded.email || adminEmail,
        name: decoded.name || "Netflix Admin",
      };
      return next();
    }

    // 2. Agar token ID si haqiqiy ObjectId bo'lmasa
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ message: "Token identifikatori noto'g'ri" });
    }

    // 3. Bazadan foydalanuvchini tekshirish
    const user = await userModel
      .findById(decoded.id)
      .select("role isBanned name email");

    if (!user) {
      return res.status(401).json({ message: "Foydalanuvchi topilmadi" });
    }

    if (user.isBanned) {
      return res
        .status(403)
        .json({ message: "Hisobingiz administrator tomonidan bloklangan" });
    }

    // Agar foydalanuvchi emaili .env dagi admin bo'lsa, unga admin roli beriladi
    const userRole =
      adminEmail && user.email?.toLowerCase() === adminEmail
        ? "admin"
        : user.role;

    req.user = {
      id: user._id.toString(),
      role: userRole,
      isBanned: user.isBanned,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Token yaroqsiz yoki muddati o'tgan" });
  }
};

module.exports = authMiddleware;
