const passport = require("passport");
const jwt = require("jsonwebtoken");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { getCookieOptions } = require("../utils/cookie");
const router = require("express").Router();

const CLIENT_URL = process.env.PRIVATE_CLIENT_URL || "http://localhost:3000";

// Google start
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// GitHub start
router.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"], session: false }),
);

// Google callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${CLIENT_URL}/auth/signin`,
  }),
  (req, res) => {
    const payload = {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, getCookieOptions());
    return res.redirect(`${CLIENT_URL}/`);
  },
);

// GitHub callback
router.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${CLIENT_URL}/auth/signin`,
  }),
  (req, res) => {
    const payload = {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, getCookieOptions());
    return res.redirect(`${CLIENT_URL}/`);
  },
);

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authMiddleware, authController.me);
router.post("/logout", authController.logout);

// Profil ichidan 6 xonali maxfiy kodni saqlash (tizimga kirgan holda)
router.post("/reset-pass", authMiddleware, authController.resetPass);

// Parolni unutganda tekshirish va yangi parol o'rnatish (tizimga kirmagan holda)
router.post("/reset", authController.reset);
router.post("/new-password", authController.newPassword);

module.exports = router;
