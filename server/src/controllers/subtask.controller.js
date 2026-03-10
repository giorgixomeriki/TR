const prisma = require('../lib/prisma');

/* Ensure the parent task belongs to the authenticated user */
const ownsTask = async (taskId, userId) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  return Boolean(task);
};

/* POST /api/tasks/:id/subtasks */
const createSubtask = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Subtask title is required.' });
    }
    if (!(await ownsTask(req.params.id, req.user.id))) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const subtask = await prisma.subtask.create({
      data: { title: title.trim(), taskId: req.params.id },
    });

    res.status(201).json(subtask);
  } catch (error) {
    next(error);
  }
};

/* GET /api/tasks/:id/subtasks */
const getSubtasks = async (req, res, next) => {
  try {
    if (!(await ownsTask(req.params.id, req.user.id))) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const subtasks = await prisma.subtask.findMany({
      where:   { taskId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json(subtasks);
  } catch (error) {
    next(error);
  }
};

/* PUT /api/subtasks/:id  — update title or toggle completed */
const updateSubtask = async (req, res, next) => {
  try {
    const sub = await prisma.subtask.findUnique({
      where:   { id: req.params.id },
      include: { task: { select: { userId: true } } },
    });

    if (!sub || sub.task.userId !== req.user.id) {
      return res.status(404).json({ message: 'Subtask not found.' });
    }

    const patch = {};
    if (req.body.title     !== undefined) patch.title     = req.body.title.trim();
    if (req.body.completed !== undefined) patch.completed = Boolean(req.body.completed);

    const updated = await prisma.subtask.update({
      where: { id: req.params.id },
      data:  patch,
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/subtasks/:id */
const deleteSubtask = async (req, res, next) => {
  try {
    const sub = await prisma.subtask.findUnique({
      where:   { id: req.params.id },
      include: { task: { select: { userId: true } } },
    });

    if (!sub || sub.task.userId !== req.user.id) {
      return res.status(404).json({ message: 'Subtask not found.' });
    }

    await prisma.subtask.delete({ where: { id: req.params.id } });
    res.status(200).json({ message: 'Subtask deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSubtask, getSubtasks, updateSubtask, deleteSubtask };
