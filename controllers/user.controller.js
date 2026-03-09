const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const movieModel = require("../models/liked-movie.model");
const savedMovieModel = require("../models/saved-movie.model");
const { default: axios } = require("axios");
class UserController {
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await userModel.findById(id).lean();
      if (!user) {
        return res.status(404).json({ message: "User topilmadi" });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async updateUser(req, res) {
    try {
      const { name, email, id } = req.body;
      await userModel.findByIdAndUpdate(id, { name, email }, { new: true });
      res.status(202).json({ message: "Updated user" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async updatePassword(req, res) {
    try {
      const { oldPass, newPass, id } = req.body;
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
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async likedMovie(req, res) {
    try {
      await movieModel.create(req.body);
      res.status(200).json({ message: "Succes" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async unLikedMovie(req, res) {
    try {
      const { id } = req.params;
      const unLike = await movieModel.find({ id }).lean();
      await movieModel.findByIdAndDelete(unLike[0]._id);
      res.status(200).json({ message: "UnLike succes" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async LikeMovie(req, res) {
    try {
      const { id } = req.params;
      const movie = await movieModel.find({ userId: id }).lean();
      res.status(200).json(movie);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async savedMovie(req, res) {
    try {
      await savedMovieModel.create(req.body);
      res.status(200).json({ message: "Succes" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async unSavedMovie(req, res) {
    try {
      const { id } = req.params;
      const unSave = await savedMovieModel.find({ id }).lean();
      await savedMovieModel.findByIdAndDelete(unSave[0]._id);
      res.status(200).json({ message: "Unsave succes" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async SavedMovie(req, res) {
    try {
      const { id } = req.params;
      const movie = await savedMovieModel.find({ userId: id }).lean();
      res.status(200).json(movie);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async addAvatar(req, res) {
    try {
      const { url } = req.body;
      await userModel.findByIdAndUpdate(
        req.user.id,
        { avatar: url },
        { new: true },
      );
      res.status(200).json({ message: "Upload Completed" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
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
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async getUpcoming(req,res){
    try {
      const upcoming = await fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.TMDB_KEY_API}`)
      console.log(upcoming);
      const upcomingJSON = await upcoming.json()
      
      res.status(200).json({upcomingJSON})
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
}
module.exports = new UserController();