const BaseError = require("../errors/base.error");
const userModel = require("../models/user.model");
const likedMovieModel = require("../models/liked-movie.model");
const savedMovieModel = require("../models/saved-movie.model");
const mongoose = require("mongoose");

class AdminController {
  // Barcha foydalanuvchilarni olish
  async getAdmin(req, res, next) {
    try {
      const allUsers = await userModel
        .find()
        .select("-password -resetPass")
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ message: "Admin", allUsers });
    } catch (error) {
      next(error);
    }
  }

  // Chuqur monitoring va platforma statistikasi
  async getStats(req, res, next) {
    try {
      const [
        totalUsers,
        totalAdmins,
        totalBanned,
        totalLikes,
        totalSaves,
        providersAgg,
        topLikedMovies,
        topSavedMovies,
      ] = await Promise.all([
        userModel.countDocuments(),
        userModel.countDocuments({ role: "admin" }),
        userModel.countDocuments({ isBanned: true }),
        likedMovieModel.countDocuments(),
        savedMovieModel.countDocuments(),
        userModel.aggregate([
          { $group: { _id: "$provider", count: { $sum: 1 } } },
        ]),
        likedMovieModel.aggregate([
          {
            $group: {
              _id: "$id",
              title: { $first: "$title" },
              poster_path: { $first: "$poster_path" },
              backdrop_path: { $first: "$backdrop_path" },
              vote_average: { $first: "$vote_average" },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
        savedMovieModel.aggregate([
          {
            $group: {
              _id: "$id",
              title: { $first: "$title" },
              poster_path: { $first: "$poster_path" },
              backdrop_path: { $first: "$backdrop_path" },
              vote_average: { $first: "$vote_average" },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
      ]);

      const providers = { local: 0, google: 0, github: 0 };
      providersAgg.forEach((item) => {
        if (item._id && providers.hasOwnProperty(item._id)) {
          providers[item._id] = item.count;
        }
      });

      const system = {
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        mongoStatus:
          mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      };

      return res.status(200).json({
        stats: {
          totalUsers,
          totalAdmins,
          totalBanned,
          totalLikes,
          totalSaves,
          providers,
          topLikedMovies,
          topSavedMovies,
          system,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Foydalanuvchi faoliyatini to'liq ko'rish (Liked va Saved filmlari)
  async getUserActivity(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userModel
        .findById(id)
        .select("-password -resetPass")
        .lean();
      if (!user) {
        throw BaseError.BadRequest(400, "Foydalanuvchi topilmadi");
      }

      const [likedMovies, savedMovies] = await Promise.all([
        likedMovieModel.find({ userId: id }).sort({ createdAt: -1 }).lean(),
        savedMovieModel.find({ userId: id }).sort({ createdAt: -1 }).lean(),
      ]);

      return res.status(200).json({
        user,
        likedMovies,
        savedMovies,
      });
    } catch (error) {
      next(error);
    }
  }

  // Foydalanuvchi rolini o'zgartirish (admin <-> user)
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!["user", "admin"].includes(role)) {
        throw BaseError.BadRequest(400, "Noto'g'ri rol tanlandi");
      }

      if (req.user.id === id && role !== "admin") {
        throw BaseError.BadRequest(
          400,
          "O'zingizni admin huquqidan mahrum qila olmaysiz",
        );
      }

      const updatedUser = await userModel
        .findByIdAndUpdate(id, { role }, { new: true })
        .select("-password -resetPass");

      if (!updatedUser) {
        throw BaseError.BadRequest(400, "Foydalanuvchi topilmadi");
      }

      return res.status(200).json({
        message: "Rol muvaffaqiyatli yangilandi",
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  // Foydalanuvchini bloklash / blokdan chiqarish
  async toggleBanUser(req, res, next) {
    try {
      const { id } = req.params;

      if (req.user.id === id) {
        throw BaseError.BadRequest(400, "O'zingizni bloklay olmaysiz!");
      }

      const user = await userModel.findById(id);
      if (!user) {
        throw BaseError.BadRequest(400, "Foydalanuvchi topilmadi");
      }

      user.isBanned = !user.isBanned;
      await user.save();

      return res.status(200).json({
        message: user.isBanned
          ? "Foydalanuvchi bloklandi"
          : "Foydalanuvchi blokdan chiqarildi",
        isBanned: user.isBanned,
      });
    } catch (error) {
      next(error);
    }
  }

  // Foydalanuvchi ma'lumotlarini tahrirlash (ism, email, avatar)
  async updateUserDetails(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email, avatar } = req.body;

      if (!name || !email) {
        throw BaseError.BadRequest(400, "Ism va email kiritilishi shart");
      }

      const emailExists = await userModel.findOne({
        email,
        _id: { $ne: id },
      });
      if (emailExists) {
        throw BaseError.BadRequest(
          400,
          "Bu email boshqa foydalanuvchi tomonidan band qilingan",
        );
      }

      const updateData = { name, email };
      if (avatar) updateData.avatar = avatar;

      const updatedUser = await userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .select("-password -resetPass");

      if (!updatedUser) {
        throw BaseError.BadRequest(400, "Foydalanuvchi topilmadi");
      }

      return res.status(200).json({
        message: "Foydalanuvchi ma'lumotlari muvaffaqiyatli yangilandi",
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  // Foydalanuvchini o'chirish (Cascade cleanup bilan)
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      if (req.user.id === id) {
        throw BaseError.BadRequest(400, "O'z hisobingizni o'chira olmaysiz!");
      }

      const user = await userModel.findById(id);
      if (!user) {
        throw BaseError.BadRequest(400, "Foydalanuvchi topilmadi");
      }

      await Promise.all([
        userModel.findByIdAndDelete(id),
        likedMovieModel.deleteMany({ userId: id }),
        savedMovieModel.deleteMany({ userId: id }),
      ]);

      return res.status(200).json({
        message:
          "Foydalanuvchi va unga tegishli barcha ma'lumotlar butunlay o'chirildi",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
