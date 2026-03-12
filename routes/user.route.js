const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const router = require("express").Router();
router.get("/user/:id", authMiddleware, userController.getUser);
router.get("/user-api", authMiddleware, userController.getAPI);
router.get("/user-liked/:id", authMiddleware, userController.LikeMovie);
router.get("/user-saved/:id", authMiddleware, userController.SavedMovie);
router.put("/user-update", authMiddleware, userController.updateUser);
router.put("/user-avatar", authMiddleware, userController.addAvatar);
router.put("/user-pass", authMiddleware, userController.updatePassword);
router.put(
  "/user-set-pass/:id",
  authMiddleware,
  userController.setPasswordOAuth,
);
router.post("/liked-movie", authMiddleware, userController.likedMovie);
router.post("/saved-movie", authMiddleware, userController.savedMovie);
router.delete(
  "/un-liked-movie/:id",
  authMiddleware,
  userController.unLikedMovie,
);
router.delete(
  "/un-saved-movie/:id",
  authMiddleware,
  userController.unSavedMovie,
);
module.exports = router;