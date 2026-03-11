'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/gym.controller');

const router = Router();
router.use(authenticate);

// Stats & exercises (static paths must come before :id params)
router.get('/stats',           ctrl.getStats);
router.get('/exercises',       ctrl.getExercises);
router.get('/body-stats',      ctrl.getBodyStats);
router.post('/body-stats',     ctrl.addBodyStat);

// Workout CRUD
router.get('/',           ctrl.getWorkouts);
router.post('/',          ctrl.createWorkout);
router.put('/:id',        ctrl.updateWorkout);
router.delete('/:id',     ctrl.deleteWorkout);

// Sessions
router.post('/sessions',           ctrl.createSession);
router.put('/sessions/:id/complete', ctrl.completeSession);

module.exports = router;
