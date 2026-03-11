const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const movieModel = require("../models/liked-movie.model");
const savedMovieModel = require("../models/saved-movie.model");
const BaseError = require("../errors/base.error");
class UserController {
  async getUser(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(404).json({ message: "Id o'rnating" });
      }
      const user = await userModel.findById(id).lean();
      if (!user) {
        return res.status(404).json({ message: "User topilmadi" });
      }
      res.status(200).json(user);
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async updateUser(req, res) {
    try {
      const { name, email, id } = req.body;
      if (!name || !email || !id) {
        throw BaseError.BadRequest("name, email va id majburiy");
      }
      await userModel.findByIdAndUpdate(id, { name, email }, { new: true });
      res.status(202).json({ message: "Updated user" });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async updatePassword(req, res) {
    try {
      const { oldPass, newPass, id } = req.body;
      if (!oldPass || !newPass || !id) {
        throw BaseError.BadRequest("Eski parolingiz, Yangi parolingiz majburiy");
      }
      const user = await userModel.findById(id).lean();
      if (!user) {
        return res.status(404).json({ message: "User topilmadi" });
      }
      const newPassword = await bcrypt.compare(String(oldPass), user.password);
      if (!newPassword) {
        return res.status(404).json({ message: "Parol xato" });
      }
      const hashedPass = await bcrypt.hash(String(newPass), 10);
      await userModel.findByIdAndUpdate(
        id,
        { password: hashedPass },
        { new: true },
      );
      res.status(202).json({ message: "Load new password" });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async likedMovie(req, res) {
    try {
      if (!req.body) {
        throw BaseError.BadRequest("Ma'lumotlarni to'ldiring");
      }
      const like = await movieModel.create(req.body);
      await userModel.findByIdAndUpdate(like.userId, {
        $addToSet: { likedMovie: like._id },
      });
      res.status(200).json({ message: "Succes" });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async unLikedMovie(req, res) {
    try {
      const { id } = req.params;
      const unLike = await movieModel.find({ id }).lean();
      if (!unLike.length) {
        return res.status(404).json({ message: "Movie topilmadi" });
      }
      await movieModel.findByIdAndDelete(unLike[0]._id);
      res.status(200).json({ message: "UnLike succes" });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async LikeMovie(req, res) {
    try {
      const { id } = req.params;
      const movie = await movieModel.find({ userId: id }).lean();
      if (!movie.length) {
        return res.status(404).json({ message: "Movie topilmadi" });
      }
      res.status(200).json(movie);
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async savedMovie(req, res) {
    try {
      if (!req.body) {
        throw BaseError.BadRequest("Ma'lumotlarni to'ldiring");
      }
      const save = await savedMovieModel.create(req.body);
      await userModel.findByIdAndUpdate(save.userId, {
        $addToSet: { savedMovie: save._id },
      });
      res.status(200).json({ message: "Succes" });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async unSavedMovie(req, res) {
    try {
      const { id } = req.params;
      const unSave = await savedMovieModel.find({ id }).lean();
      if (!unSave.length) {
        return res.status(404).json({ message: "Movie topilmadi" });
      }
      await savedMovieModel.findByIdAndDelete(unSave[0]._id);
      res.status(200).json({ message: "Unsave succes" });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async SavedMovie(req, res) {
    try {
      const { id } = req.params;
      const movie = await savedMovieModel.find({ userId: id }).lean();
      if (!movie.length) {
        return res.status(404).json({ message: "Movie topilmadi" });
      }
      res.status(200).json(movie);
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async addAvatar(req, res) {
    try {
      const { url } = req.body;
      if (!url) {
        throw BaseError.BadRequest("Url majburiy");
      }
      await userModel.findByIdAndUpdate(
        req.user.id,
        { avatar: url },
        { new: true },
      );
      res.status(200).json({ message: "Upload Completed" });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async setPasswordOAuth(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(404).json({ message: "Id o'rnating" });
      }
      const { password } = req.body;
      if (!password) {
        return res.status(404).json({ message: "Password o'rnating" });
      }
      const hashedPass = await bcrypt.hash(password, 10);
      await userModel.findByIdAndUpdate(
        id,
        { password: hashedPass },
        { new: true },
      );
      res.status(200).json({ message: "Password success" });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
  async getAPI(req, res) {
    try {
      const upcoming = await fetch(
        `https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.TMDB_KEY_API}`,
      );
      const action = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_KEY_API}&with_genres=28`,
      );
      const comedy = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_KEY_API}&with_genres=35`,
      );
      const horror = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_KEY_API}&with_genres=27`,
      );
      const animation = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_KEY_API}&with_genres=16`,
      );
      const upcomingJSON = await upcoming.json(),
        actionJSON = await action.json(),
        comedyJSON = await comedy.json(),
        horrorJSON = await horror.json(),
        animationJSON = await animation.json();
      res.status(200).json({
        upcomingJSON,
        actionJSON,
        comedyJSON,
        horrorJSON,
        animationJSON,
      });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
}
module.exports = new UserController();