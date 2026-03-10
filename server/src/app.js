const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const authRoutes       = require('./routes/auth.routes');
const taskRoutes       = require('./routes/task.routes');
const userRoutes       = require('./routes/user.routes');
const attachmentRoutes = require('./routes/attachment.routes');
const subtaskRoutes    = require('./routes/subtask.routes');
const aiRoutes         = require('./routes/ai.routes');
const skillRoutes      = require('./routes/skill.routes');
const focusRoutes      = require('./routes/focus.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// CORS — allow frontend origin
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'TaskFlow API is running 🚀' });
});

// API Routes
app.use('/api/auth',  authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/user',  userRoutes);
app.use('/api',       attachmentRoutes);
app.use('/api',       subtaskRoutes);
app.use('/api/ai',    aiRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/focus',  focusRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
