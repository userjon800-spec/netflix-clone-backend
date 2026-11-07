const router = require("express").Router();
const adminController = require("../controllers/admin.controller");
const adminMiddleware = require("../middleware/admin.middleware");
const authMiddleware = require("../middleware/auth.middleware");

// Barcha admin routelari uchun authMiddleware va adminMiddleware tekshiruvi
router.use(authMiddleware, adminMiddleware);

router.get("/admin", adminController.getAdmin);
router.get("/admin/stats", adminController.getStats);
router.get("/admin/user/:id/activity", adminController.getUserActivity);
router.put("/admin/role/:id", adminController.updateUserRole);
router.put("/admin/ban/:id", adminController.toggleBanUser);
router.put("/admin/user/:id", adminController.updateUserDetails);
router.delete("/admin/user/:id", adminController.deleteUser);

module.exports = router;
