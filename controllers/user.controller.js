const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const movieModel = require("../models/liked-movie.model");
const savedMovieModel = require("../models/saved-movie.model");
const BaseError = require("../errors/base.error");
const axios = require("axios");

class UserController {
  async getUser(req, res, next) {
    try {
      const id = req.params.id || req.user?.id;
      if (!id) {
        throw BaseError.BadRequest("Foydalanuvchi ID si topilmadi");
      }
      const user = await userModel.findById(id).select("-password -resetPass").lean();
      if (!user) {
        throw BaseError.NotFound("Foydalanuvchi topilmadi");
      }
      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { name, email } = req.body;
      const userId = req.user.id; // XAVFSIZ: req.user.id dan olinadi!

      if (!name || !email) {
        throw BaseError.BadRequest("Ism va email kiritilishi shart");
      }

      // Agar email o'zgargan bo'lsa, boshqa foydalanuvchida yo'qligini tekshirish
      const existingUser = await userModel.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        throw BaseError.BadRequest("Ushbu email boshqa foydalanuvchi tomonidan band qilingan");
      }

      const updated = await userModel
        .findByIdAndUpdate(userId, { name, email }, { new: true })
        .select("-password -resetPass");

      return res.status(200).json({ message: "Profil muvaffaqiyatli yangilandi", user: updated });
    } catch (error) {
      next(error);
    }
  }

  async updatePassword(req, res, next) {
    try {
      const { oldPass, newPass } = req.body;
      const userId = req.user.id; // XAVFSIZ: req.user.id dan olinadi!

      if (!oldPass || !newPass) {
        throw BaseError.BadRequest("Eski parol va yangi parol kiritilishi shart");
      }

      if (String(newPass).length < 6) {
        throw BaseError.BadRequest("Yangi parol kamida 6 belgidan iborat bo'lishi kerak");
      }

      const user = await userModel.findById(userId);
      if (!user) {
        throw BaseError.NotFound("Foydalanuvchi topilmadi");
      }

      if (!user.password) {
        throw BaseError.BadRequest("Ushbu akkauntda parol o'rnatilmagan, avval parol o'rnating");
      }

      const isPassCorrect = await bcrypt.compare(String(oldPass), user.password);
      if (!isPassCorrect) {
        throw BaseError.BadRequest("Eski parol noto'g'ri kiritildi");
      }

      const hashedPass = await bcrypt.hash(String(newPass), 10);
      user.password = hashedPass;
      await user.save();

      return res.status(200).json({ message: "Parol muvaffaqiyatli o'zgartirildi" });
    } catch (error) {
      next(error);
    }
  }

  async setPasswordOAuth(req, res, next) {
    try {
      const userId = req.user.id; // XAVFSIZ: URL param emas, tokendan olinadi!
      const { password } = req.body;

      if (!password || String(password).length < 6) {
        throw BaseError.BadRequest("Parol kamida 6 belgidan iborat bo'lishi kerak");
      }

      const hashedPass = await bcrypt.hash(String(password), 10);
      await userModel.findByIdAndUpdate(userId, { password: hashedPass }, { new: true });

      return res.status(200).json({ message: "Parol muvaffaqiyatli o'rnatildi" });
    } catch (error) {
      next(error);
    }
  }

  async likedMovie(req, res, next) {
    try {
      const movieData = req.body;
      const userId = req.user.id; // XAVFSIZ: req.user dan olinadi!

      if (!movieData || !movieData.id) {
        throw BaseError.BadRequest("Film ma'lumotlari kiritilishi shart");
      }

      // Dublikat tekshiruvi
      const existing = await movieModel.findOne({ id: movieData.id, userId });
      if (existing) {
        return res.status(200).json({ message: "Film allaqachon yoqtirilgan ro'yxatida mavjud", like: existing });
      }

      const like = await movieModel.create({
        ...movieData,
        userId,
      });

      await userModel.findByIdAndUpdate(userId, {
        $addToSet: { likedMovie: like._id },
      });

      return res.status(200).json({ message: "Film yoqtirilganlarga qo'shildi", like });
    } catch (error) {
      next(error);
    }
  }

  async unLikedMovie(req, res, next) {
    try {
      const movieId = Number(req.params.id);
      const userId = req.user.id; // XAVFSIZ: faqat joriy foydalanuvchining filmini o'chiramiz!

      const unLike = await movieModel.findOneAndDelete({ id: movieId, userId });
      if (!unLike) {
        return res.status(404).json({ message: "Film yoqtirilganlar ro'yxatida topilmadi" });
      }

      await userModel.findByIdAndUpdate(userId, {
        $pull: { likedMovie: unLike._id },
      });

      return res.status(200).json({ message: "Film yoqtirilganlardan o'chirildi" });
    } catch (error) {
      next(error);
    }
  }

  async LikeMovie(req, res, next) {
    try {
      // Agar id berilgan bo'lsa va u admin bo'lmasa, o'zinikini yoki parametrnikini ko'radi
      const userId = req.params.id || req.user.id;
      const movies = await movieModel.find({ userId }).sort({ createdAt: -1 }).lean();
      return res.status(200).json(movies);
    } catch (error) {
      next(error);
    }
  }

  async savedMovie(req, res, next) {
    try {
      const movieData = req.body;
      const userId = req.user.id; // XAVFSIZ!

      if (!movieData || !movieData.id) {
        throw BaseError.BadRequest("Film ma'lumotlari kiritilishi shart");
      }

      const existing = await savedMovieModel.findOne({ id: movieData.id, userId });
      if (existing) {
        return res.status(200).json({ message: "Film allaqachon saqlangan", save: existing });
      }

      const save = await savedMovieModel.create({
        ...movieData,
        userId,
      });

      await userModel.findByIdAndUpdate(userId, {
        $addToSet: { savedMovie: save._id },
      });

      return res.status(200).json({ message: "Film saqlanganlarga qo'shildi", save });
    } catch (error) {
      next(error);
    }
  }

  async unSavedMovie(req, res, next) {
    try {
      const movieId = Number(req.params.id);
      const userId = req.user.id; // XAVFSIZ!

      const unSave = await savedMovieModel.findOneAndDelete({ id: movieId, userId });
      if (!unSave) {
        return res.status(404).json({ message: "Film saqlanganlar ro'yxatida topilmadi" });
      }

      await userModel.findByIdAndUpdate(userId, {
        $pull: { savedMovie: unSave._id },
      });

      return res.status(200).json({ message: "Film saqlanganlardan o'chirildi" });
    } catch (error) {
      next(error);
    }
  }

  async SavedMovie(req, res, next) {
    try {
      const userId = req.params.id || req.user.id;
      const movies = await savedMovieModel.find({ userId }).sort({ createdAt: -1 }).lean();
      return res.status(200).json(movies);
    } catch (error) {
      next(error);
    }
  }

  async addAvatar(req, res, next) {
    try {
      const { url } = req.body;
      if (!url) {
        throw BaseError.BadRequest("Rasm manzili (URL) kiritilishi shart");
      }
      const updatedUser = await userModel
        .findByIdAndUpdate(req.user.id, { avatar: url }, { new: true })
        .select("-password -resetPass");

      return res.status(200).json({ message: "Avatar muvaffaqiyatli yuklandi", user: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  // Tezkor parallel TMDB so'rovlari
  async getAPI(req, res, next) {
    try {
      const apiKey = process.env.TMDB_KEY_API;
      if (!apiKey) {
        throw BaseError.BadRequest("TMDB API kaliti mavjud emas");
      }

      const [upcomingRes, actionRes, comedyRes, horrorRes, animationRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}`),
        axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=28`),
        axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=35`),
        axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=27`),
        axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=16`),
      ]);

      return res.status(200).json({
        upcomingJSON: upcomingRes.data,
        actionJSON: actionRes.data,
        comedyJSON: comedyRes.data,
        horrorJSON: horrorRes.data,
        animationJSON: animationRes.data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Telegram bot orqali xavfsiz fikr-mulohaza (feedback) yuborish
  async sendFeedback(req, res, next) {
    try {
      const { name, email, message, feedbackType, rating } = req.body;

      if (!message || !email) {
        throw BaseError.BadRequest("Email va xabar matni kiritilishi shart");
      }

      const botToken = process.env.TELEGRAM_TOKEN_BOT || process.env.NEXT_PUBLIC_TOKEN_BOT;
      const chatId = process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_CHAT_ID;

      if (!botToken || !chatId) {
        return res.status(200).json({ message: "Xabar qabul qilindi (Bot sozlanmagan)" });
      }

      const emoji = {
        general: "📝",
        bug: "🐛",
        feature: "💡",
        other: "❓",
      };

      const typeEmoji = emoji[feedbackType] || "📝";
      const ratingStars = "⭐".repeat(Number(rating) || 0) + "☆".repeat(Math.max(0, 5 - (Number(rating) || 0)));

      const text = `${typeEmoji} Yangi Fikr-mulohaza (Netflix Clone):\n` +
        `• Turi: ${(feedbackType || "general").toUpperCase()}\n` +
        `• Ism: ${name || "Ko'rsatilmadi"}\n` +
        `• Email: ${email}\n` +
        `• Baho: ${ratingStars} (${rating || 0}/5)\n` +
        `• Xabar:\n${message}\n\n` +
        `📅 Sana: ${new Date().toLocaleString()}`;

      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text,
      });

      return res.status(200).json({ message: "Fikr-mulohazangiz muvaffaqiyatli yuborildi!" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
