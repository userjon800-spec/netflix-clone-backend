const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const BaseError = require("../errors/base.error");
const { getCookieOptions } = require("../utils/cookie");

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw BaseError.BadRequest("Email va parol kiritilishi shart");
      }

      const adminGmail = process.env.ADMIN_GMAIL?.trim().toLowerCase();
      const adminPass = process.env.ADMIN_PASSWORD?.trim();
      const inputEmail = String(email).trim().toLowerCase();
      const inputPassword = String(password).trim();

      // 1. Admin tekshiruvi (.env dagi admin)
      if (
        adminGmail &&
        adminPass &&
        inputEmail === adminGmail &&
        inputPassword === adminPass
      ) {
        let adminUser = await userModel.findOne({ email: inputEmail });
        if (!adminUser) {
          const hashPass = await bcrypt.hash(inputPassword, 10);
          adminUser = await userModel.create({
            name: "Netflix SuperAdmin",
            email: adminGmail,
            password: hashPass,
            role: "admin",
            provider: "local",
          });
        } else if (adminUser.role !== "admin") {
          adminUser.role = "admin";
          await adminUser.save();
        }

        const payload = {
          id: adminUser._id.toString(),
          email: adminUser.email,
          role: "admin",
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "1d",
        });
        res.cookie("token", token, getCookieOptions());
        return res.status(200).json({
          message: "Admin login successful",
          token,
          user: {
            id: adminUser._id,
            _id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: "admin",
            avatar: adminUser.avatar,
          },
        });
      }

      // 2. Oddiy foydalanuvchi tekshiruvi
      const user = await userModel.findOne({ email: inputEmail });
      if (!user) {
        throw BaseError.BadRequest("Bunday foydalanuvchi mavjud emas");
      }

      if (user.isBanned) {
        throw BaseError.Forbidden("Hisobingiz administrator tomonidan bloklangan");
      }

      if (!user.password) {
        throw BaseError.BadRequest(
          "Ushbu hisob Google yoki GitHub orqali yaratilgan. Iltimos ijtimoiy tarmoq orqali kiring"
        );
      }

      const isPassMatch = await bcrypt.compare(inputPassword, user.password);
      if (!isPassMatch) {
        throw BaseError.BadRequest("Parol noto'g'ri kiritildi");
      }

      // Agar email .env dagi admin bilan mos kelsa, rolni yangilash
      if (adminGmail && user.email.toLowerCase() === adminGmail && user.role !== "admin") {
        user.role = "admin";
        await user.save();
      }

      const payload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.cookie("token", token, getCookieOptions());

      return res.status(200).json({
        message: "Muvaffaqiyatli login",
        token,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        throw BaseError.BadRequest("Ism, email va parol kiritilishi shart");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw BaseError.BadRequest("Email formati noto'g'ri");
      }

      if (String(password).length < 4) {
        throw BaseError.BadRequest("Parol kamida 4 belgidan iborat bo'lishi kerak");
      }

      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        throw BaseError.BadRequest("Ushbu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan");
      }

      const hashPass = await bcrypt.hash(String(password), 10);
      const user = await userModel.create({
        name,
        email,
        password: hashPass,
        role: "user",
        provider: "local",
      });

      const payload = { id: user._id, email: user.email, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.cookie("token", token, getCookieOptions());

      return res.status(200).json({
        message: "Ro'yxatdan muvaffaqiyatli o'tdingiz",
        token,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      let user = null;
      if (req.user?.id && req.user.id !== "admin") {
        user = await userModel
          .findById(req.user.id)
          .select("-password")
          .lean();
      }

      if (!user) {
        if (req.user?.role === "admin") {
          return res.status(200).json({
            user: {
              id: req.user.id || "admin",
              _id: req.user.id || "admin",
              email: req.user.email || process.env.ADMIN_GMAIL,
              name: req.user.name || "Netflix SuperAdmin",
              role: "admin",
              avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            },
          });
        }
        throw BaseError.UnAuthorized(401, "Foydalanuvchi topilmadi");
      }

      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  logout(req, res) {
    const isProd = process.env.NODE_ENV === "production";
    const clearOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
    };
    res.clearCookie("token", clearOptions);
    res.cookie("token", "", {
      ...clearOptions,
      expires: new Date(0),
    });
    return res.status(200).json({ message: "Tizimdan muvaffaqiyatli chiqildi" });
  }

  // Profil ichidan 6 xonali maxfiy reset kodini o'rnatish
  async resetPass(req, res, next) {
    try {
      const { resetPass } = req.body;
      const targetId = req.user.id; // XAVFSIZ: id req.user dan olinadi!

      if (!resetPass || String(resetPass).length < 6) {
        throw BaseError.BadRequest("Maxfiy kod kamida 6 belgidan iborat bo'lishi kerak");
      }

      const passHash = await bcrypt.hash(String(resetPass), 10);
      await userModel.findByIdAndUpdate(targetId, { resetPass: passHash }, { new: true });

      return res.status(200).json({ message: "Maxfiy tiklash kodi muvaffaqiyatli o'rnatildi" });
    } catch (error) {
      next(error);
    }
  }

  // Tizimga kirmagan holatda email va 6 xonali kod orqali tekshirish
  async reset(req, res, next) {
    try {
      const { reset, email } = req.body;
      if (!email || !reset) {
        throw BaseError.BadRequest("Email va 6 xonali kod kiritilishi shart");
      }

      const user = await userModel.findOne({ email });
      if (!user || !user.resetPass) {
        throw BaseError.BadRequest("Foydalanuvchi topilmadi yoki maxfiy kod belgilanmagan");
      }

      const isCodeValid = await bcrypt.compare(String(reset), user.resetPass);
      if (!isCodeValid) {
        throw BaseError.BadRequest("Kiritilgan maxfiy kod noto'g'ri");
      }

      // Xavfsiz, bir martalik qisqa muddatli token (15 daqiqa)
      const resetToken = jwt.sign(
        { userId: user._id, type: "password_reset" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      return res.status(200).json({
        message: "Kod tasdiqlandi",
        userId: user._id,
        resetToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // Yangi parolni o'rnatish
  async newPassword(req, res, next) {
    try {
      const { password, id, resetToken } = req.body;

      if (!password || String(password).length < 6) {
        throw BaseError.BadRequest("Yangi parol kamida 6 belgidan iborat bo'lishi kerak");
      }

      let userId = id;

      // Agar resetToken berilgan bo'lsa, xavfsiz verify qilamiz
      if (resetToken) {
        try {
          const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
          if (decoded.type !== "password_reset") {
            throw BaseError.BadRequest("Yaroqsiz reset token");
          }
          userId = decoded.userId;
        } catch (e) {
          throw BaseError.BadRequest("Tiklash tokeni muddati o'tgan yoki yaroqsiz");
        }
      }

      if (!userId) {
        throw BaseError.BadRequest("Foydalanuvchi identifikatori topilmadi");
      }

      const hash = await bcrypt.hash(String(password), 10);
      await userModel.findByIdAndUpdate(userId, {
        password: hash,
        // Kod bir marta ishlatilgandan keyin xavfsizlik uchun resetPass ni tozalaymiz
        resetPass: null,
      });

      return res.status(200).json({ message: "Parol muvaffaqiyatli yangilandi" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
