const express        = require('express');
const router         = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/coins',  userController.getCoins);
router.get('/skills', userController.getUserSkills);

module.exports = router;
