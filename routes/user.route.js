const userController = require("../controllers/user.controller");
const router = require("express").Router();
router.get("/user/:id", userController.getUser);
router.put("/user-update", userController.updateUser);
router.put("/user-pass", userController.updatePassword);
router.post("/liked-movie", userController.likedMovie);
router.delete("/un-liked-movie/:id", userController.unLikedMovie);
module.exports = router;