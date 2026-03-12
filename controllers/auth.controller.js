const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const BaseError = require("../errors/base.error");
class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "email va password majburiy" });
      }
      if (
        email === process.env.ADMIN_GMAIL &&
        password === process.env.ADMIN_PASSWORD
      ) {
        const payload = {
          id: "admin",
          email: process.env.ADMIN_GMAIL,
          role: "admin",
        };
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
        return res.status(200).json({
          message: "Admin login successful",
          token,
          user: { email: process.env.ADMIN_GMAIL, role: "admin" },
        });
      }
      const user = await userModel.findOne({ email });
      if (!user) {
        throw BaseError.BadRequest("Bunday user mavjud emas");
      }
      const itsPass = await bcrypt.compare(password, user.password);
      if (!itsPass) {
        throw BaseError.BadRequest("Parol xato kirildi");
      }
      const payload = { id: user._id, email: user.email, role: user.role };
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
      res.status(200).json({
        message: "Muvaffaqiyatli login",
        token,
        user: { id: user._id, email: user.email, role: user.role },
      });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
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
        throw BaseError.BadRequest("Bunday user mavjud emas");
      }
      const payload = { id: user._id, email: user.email, role: user.role };
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
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async me(req, res) {
    try {
      if (req.user.role === "admin") {
        return res
          .status(200)
          .json({ user: { email: process.env.ADMIN_GMAIL, role: "admin" } });
      }
      const token = req.cookies?.token;
      if (!token) throw BaseError.Unauthorized("Token topilmadi");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      if (!user) throw BaseError.Unauthorized("Token topilmadi");
      return res.status(200).json({ user });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  logout(req, res) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };
    res.clearCookie("token", {
      ...cookieOptions,
    });
    res.cookie("token", "", {
      ...cookieOptions,
      expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out" });
  }
  async resetPass(req, res) {
    try {
      const { resetPass, id } = req.body;
      if (!resetPass || !id) {
        throw BaseError.BadRequest("resetPass va id majburiy");
      }
      const pass = await bcrypt.hash(String(resetPass), 10);
      await userModel.findByIdAndUpdate(id, { resetPass: pass }, { new: true });
      res.status(200).json({ message: "Succes" });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async reset(req, res) {
    try {
      const { reset, email } = req.body;
      if (!email || !reset) {
        throw BaseError.BadRequest("email va resetPass majburiy");
      }
      const user = await userModel.find({ email }).lean();
      if (!user.length) {
        return res.status(401).json({ message: "Bunday user mavjud emas" });
      }
      const pass = await bcrypt.compare(reset, user[0].password);
      if (pass) {
        res.status(200).json({ message: "Correct", userId: user[0]._id });
      } else {
        res.status(401).json({ message: "Parol xato" });
      }
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async newPassword(req, res) {
    try {
      const { password, id } = req.body;
      if (!password || !id) {
        throw BaseError.BadRequest("password va id majburiy");
      }
      const hash = await bcrypt.hash(password, 10);
      await userModel.findByIdAndUpdate(id, { password: hash }, { new: true });
      res.status(200).json({ message: "Succes" });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
}
module.exports = new AuthController();