'use strict';

const gym = require('../services/gym.service');

const getWorkouts    = async (req, res, next) => { try { res.json(await gym.getWorkouts(req.user.id)); } catch (e) { next(e); } };
const createWorkout  = async (req, res, next) => { try { res.status(201).json(await gym.createWorkout(req.user.id, req.body)); } catch (e) { next(e); } };
const updateWorkout  = async (req, res, next) => { try { res.json(await gym.updateWorkout(req.user.id, req.params.id, req.body)); } catch (e) { next(e); } };
const deleteWorkout  = async (req, res, next) => { try { await gym.deleteWorkout(req.user.id, req.params.id); res.status(204).end(); } catch (e) { next(e); } };

const getExercises   = async (req, res, next) => { try { res.json(await gym.getExercises()); } catch (e) { next(e); } };

const createSession  = async (req, res, next) => { try { res.status(201).json(await gym.createSession(req.user.id, req.body.workoutId)); } catch (e) { next(e); } };
const completeSession = async (req, res, next) => { try { res.json(await gym.completeSession(req.user.id, req.params.id, req.body)); } catch (e) { next(e); } };

const getStats       = async (req, res, next) => { try { res.json(await gym.getStats(req.user.id)); } catch (e) { next(e); } };

const getBodyStats   = async (req, res, next) => { try { res.json(await gym.getBodyStats(req.user.id)); } catch (e) { next(e); } };
const addBodyStat    = async (req, res, next) => { try { res.status(201).json(await gym.addBodyStat(req.user.id, req.body)); } catch (e) { next(e); } };

module.exports = {
  getWorkouts, createWorkout, updateWorkout, deleteWorkout,
  getExercises,
  createSession, completeSession,
  getStats,
  getBodyStats, addBodyStat,
};
