const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
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
      res.status(401).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async updateUser(req, res) {
    try {
      const { name, email, id } = req.body;
      await userModel.findByIdAndUpdate(id, { name, email }, { new: true });
      res.status(202).json({ message: "Updated user" });
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
  async updatePassword(req, res) {
    try {
      const { oldPass, newPass, id } = req.body;
      const user = await userModel.findById(id).lean();
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
      res.status(202).json({message: "Load new password"})
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
}
module.exports = new UserController();