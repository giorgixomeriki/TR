const taskService = require('../services/task.service');

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

const getTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getAllTasks(req.user.id);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.id);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, dueDate, rewardCoins, skillIds } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Task title is required.' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ message: 'Title must be under 200 characters.' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
    if (rewardCoins !== undefined) {
      const coins = Number(rewardCoins);
      if (!Number.isInteger(coins) || coins < 0 || coins > 10000) {
        return res.status(400).json({ message: 'rewardCoins must be an integer between 0 and 10000.' });
      }
    }

    const task = await taskService.createTask({
      title:       title.trim(),
      description: description?.trim() || null,
      status:      status || 'TODO',
      dueDate:     dueDate || null,
      rewardCoins: rewardCoins !== undefined ? Number(rewardCoins) : 10,
      skillIds:    Array.isArray(skillIds) ? skillIds : [],
      userId:      req.user.id,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { title, description, notes, status, dueDate, rewardCoins, skillIds } = req.body;

    if (title !== undefined && title.trim().length === 0) {
      return res.status(400).json({ message: 'Task title cannot be empty.' });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
    if (rewardCoins !== undefined) {
      const coins = Number(rewardCoins);
      if (!Number.isInteger(coins) || coins < 0 || coins > 10000) {
        return res.status(400).json({ message: 'rewardCoins must be an integer between 0 and 10000.' });
      }
    }

    const task = await taskService.updateTask(req.params.id, req.user.id, {
      ...(title        !== undefined && { title: title.trim() }),
      ...(description  !== undefined && { description: description.trim() }),
      ...(notes        !== undefined && { notes }),
      ...(status       !== undefined && { status }),
      ...('dueDate' in req.body      && { dueDate }),
      ...(rewardCoins  !== undefined && { rewardCoins: Number(rewardCoins) }),
      ...(skillIds     !== undefined && { skillIds: Array.isArray(skillIds) ? skillIds : [] }),
    });

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id, req.user.id);
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
