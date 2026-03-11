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
const financeRoutes    = require('./routes/finance.routes');
const habitRoutes      = require('./routes/habit.routes');
const gymRoutes        = require('./routes/gym.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// CORS — allowed origins
// • Any http://localhost:* port is allowed (Vite dev server can use 5173, 5174, 5175, …)
// • Explicit production domains are whitelisted by exact match
const PRODUCTION_ORIGINS = [
  'https://action-psi-opal.vercel.app',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header = server-to-server / curl / Postman — allow
      if (!origin) return callback(null, true);

      // Any localhost port — allow (covers 5173, 5174, 5175, etc.)
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }

      // Explicit production whitelist — allow
      if (PRODUCTION_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
app.use('/api/focus',   focusRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/habits',  habitRoutes);
app.use('/api/gym',     gymRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
