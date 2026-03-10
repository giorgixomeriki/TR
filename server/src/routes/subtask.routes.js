const express           = require('express');
const router            = express.Router();
const { authenticate }  = require('../middlewares/auth.middleware');
const subtaskController = require('../controllers/subtask.controller');

router.use(authenticate);

// Task-scoped
router.post('/tasks/:id/subtasks', subtaskController.createSubtask);
router.get('/tasks/:id/subtasks',  subtaskController.getSubtasks);

// Stand-alone
router.put('/subtasks/:id',    subtaskController.updateSubtask);
router.delete('/subtasks/:id', subtaskController.deleteSubtask);

module.exports = router;
