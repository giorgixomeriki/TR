'use strict';

const router           = require('express').Router();
const ctrl             = require('../controllers/habit.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

/* Static routes must come before /:id */
router.get('/stats',   ctrl.getStats);
router.get('/heatmap', ctrl.getHeatmap);

/* CRUD */
router.get('/',     ctrl.getHabits);
router.post('/',    ctrl.createHabit);
router.put('/:id',  ctrl.updateHabit);
router.delete('/:id', ctrl.deleteHabit);

/* Toggle completion for today */
router.post('/:id/complete', ctrl.completeHabit);

module.exports = router;
