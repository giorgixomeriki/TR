const express        = require('express');
const router         = express.Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All task routes require authentication
router.use(authenticate);

router.get('/',      taskController.getTasks);
router.get('/:id',   taskController.getTask);
router.post('/',     taskController.createTask);
router.put('/:id',   taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
