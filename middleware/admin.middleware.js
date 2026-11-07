module.exports = function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Autentifikatsiyadan o'tilmagan" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Faqat admin foydalanishi mumkin" });
  }
  next();
};
