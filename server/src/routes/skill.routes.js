const express          = require('express');
const router           = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const skillController  = require('../controllers/skill.controller');

router.use(authenticate);

router.get('/', skillController.getAllSkills);

module.exports = router;
