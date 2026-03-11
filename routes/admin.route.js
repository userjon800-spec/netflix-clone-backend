const router = require("express").Router();
const adminController = require("../controllers/admin.controller");
const adminMiddleware = require("../middleware/admin.middleware");
const authMiddleware = require("../middleware/auth.middleware");
router.get("/admin", authMiddleware, adminMiddleware, adminController.getAdmin);
module.exports = router;