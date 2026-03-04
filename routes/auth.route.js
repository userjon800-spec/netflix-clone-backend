const authController = require("../controllers/auth.controller");
const router = require("express").Router();
router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authController.me);
router.post("/logout", authController.logout);
module.exports = router;