const userController = require("../controllers/user.controller");
const router = require("express").Router();
router.get('/user/:id',userController.getUser)
router.put('/user-update',userController.updateUser)
router.put('/user-pass',userController.updatePassword)
module.exports = router;