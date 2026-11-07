const BaseError = require("../errors/base.error");

module.exports = function errorMiddleware(err, req, res, next) {
  if (err instanceof BaseError) {
    return res.status(err.statusCode).json({
      message: err.message,
      errors: err.error,
    });
  }

  // Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "maydon";
    return res.status(400).json({
      message: `Ushbu ${field} bilan foydalanuvchi allaqachon mavjud`,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: messages.join(", "),
    });
  }

  // Handle invalid JWT
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Yaroqsiz yoki muddati o'tgan token",
    });
  }

  console.error("Kutilmagan xatolik:", err);
  return res.status(500).json({
    message: err.message || "Serverda ichki xatolik yuz berdi",
  });
};
