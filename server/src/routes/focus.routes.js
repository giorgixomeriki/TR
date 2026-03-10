'use strict';

const express    = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { startSession, completeSession, getStats } = require('../controllers/focus.controller');

const router = express.Router();

router.post('/start',    authenticate, startSession);
router.post('/complete', authenticate, completeSession);
router.get('/stats',     authenticate, getStats);

module.exports = router;
