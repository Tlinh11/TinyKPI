import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import positionRoutes from './modules/positions/position.routes.js';
import userRoutes from './modules/users/user.routes.js';
import strategyRoutes from './modules/strategy-assessment/strategy.routes.js';
import bscRoutes from './modules/bsc/bsc.routes.js';
import processRoutes from './modules/master-process/process.routes.js';
import slaRoutes from './modules/sla/sla.routes.js';
import auditRoutes from './modules/audit-logs/audit.routes.js';
import taskRoutes from './modules/tasks/task.routes.js';
import calendarRoutes from './modules/calendar/calendar.routes.js';
import monitoringRoutes from './modules/monitoring/monitoring.routes.js';
import trainingRoutes from './modules/training-exams/training.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TopKPI Clone Backend API',
    version: '2026.09.8152-linux',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/strategy-assessment', strategyRoutes);
app.use('/api/bsc', bscRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/exams', trainingRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/settings', settingsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = config.port;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 TinyKPI Backend Server running at http://localhost:${PORT}`);
    console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
  });
}

export default app;
