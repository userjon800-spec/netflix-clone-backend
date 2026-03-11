const BaseError = require("../errors/base.error");
const userModel = require("../models/user.model");
class AdminController {
  async getAdmin(req, res) {
    try {
      const allUsers = await userModel.find().lean();
      res.status(200).json({ message: "Admin", allUsers });
    } catch (error) {
      throw BaseError.BadRequest("Xatolik iltimos keyinroq urining", error);
    }
  }
}
module.exports = new AdminController();