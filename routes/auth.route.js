const passport = require("passport");
const jwt = require("jsonwebtoken");
const authController = require("../controllers/auth.controller");
const router = require("express").Router();
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
    failureRedirect: "http://localhost:3000/auth/signin",
  }),
  (req, res) => {
    const payload = { id: req.user._id, email: req.user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
    return res.redirect("http://localhost:3000/");
  },
);
// GitHub callback
router.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "http://localhost:3000/auth/signin",
  }),
  (req, res) => {
    const payload = { id: req.user._id, email: req.user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
    return res.redirect("http://localhost:3000/");
  },
);
router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authController.me);
router.post("/logout", authController.logout);
router.post("/reset-pass", authController.resetPass);
router.post("/reset", authController.reset);
router.post("/new-password", authController.newPassword);
module.exports = router;