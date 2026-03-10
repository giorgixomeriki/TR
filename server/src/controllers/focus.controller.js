'use strict';

const focusService = require('../services/focus.service');

const startSession = async (req, res, next) => {
  try {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ message: 'taskId is required.' });
    const session = await focusService.startSession(req.user.id, taskId);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

const completeSession = async (req, res, next) => {
  try {
    const { sessionId, duration, note } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required.' });
    const result = await focusService.completeSession(sessionId, req.user.id, {
      duration: Number(duration) || 0,
      note,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await focusService.getStats(req.user.id);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};

module.exports = { startSession, completeSession, getStats };
