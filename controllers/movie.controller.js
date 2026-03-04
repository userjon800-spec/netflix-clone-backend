const jwt = require("jsonwebtoken");
class MovieController{
    getData(req, res) {
    try {
      const headers = req.headers.authorization;
      if (!headers) {
        return res.status(401).json({ message: "Token yo'q" });
      }
      const token = headers.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
        return res.status(401).json({ message: "Bunday token yo'q" });
      }
      res.json({ decoded });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Xatolik iltimos keyinroq urining" });
    }
  }
}
module.exports =new MovieController()