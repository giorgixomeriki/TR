const express          = require('express');
const router           = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const aiController     = require('../controllers/ai.controller');

router.use(authenticate);

router.post('/task-advice', aiController.getTaskAdvice);

module.exports = router;
