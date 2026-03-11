'use strict';

const svc = require('../services/habit.service');

const getHabits = async (req, res, next) => {
  try {
    const habits = await svc.getHabits(req.user.id);
    res.json(habits);
  } catch (err) { next(err); }
};

const createHabit = async (req, res, next) => {
  try {
    const habit = await svc.createHabit(req.user.id, req.body);
    res.status(201).json(habit);
  } catch (err) { next(err); }
};

const updateHabit = async (req, res, next) => {
  try {
    const habit = await svc.updateHabit(req.user.id, req.params.id, req.body);
    res.json(habit);
  } catch (err) { next(err); }
};

const deleteHabit = async (req, res, next) => {
  try {
    await svc.deleteHabit(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
};

const completeHabit = async (req, res, next) => {
  try {
    const result = await svc.completeHabit(req.user.id, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await svc.getStats(req.user.id);
    res.json(stats);
  } catch (err) { next(err); }
};

const getHeatmap = async (req, res, next) => {
  try {
    const weeks   = parseInt(req.query.weeks) || 16;
    const heatmap = await svc.getHeatmap(req.user.id, weeks);
    res.json(heatmap);
  } catch (err) { next(err); }
};

module.exports = { getHabits, createHabit, updateHabit, deleteHabit, completeHabit, getStats, getHeatmap };
