import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import gradesRoutes from './routes/grades.js';
import attendanceRoutes from './routes/attendance.js';
import schedulesRoutes from './routes/schedules.js';

// Configuration
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
let db;
async function initDatabase() {
  try {
    db = await open({
      filename: process.env.DATABASE_PATH || path.join(__dirname, 'database.db'),
      driver: sqlite3.Database,
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('student', 'teacher', 'admin')) NOT NULL DEFAULT 'student',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        teacherId TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(teacherId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        courseId TEXT NOT NULL,
        dayOfWeek TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        room TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS grades (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        courseId TEXT NOT NULL,
        grade REAL NOT NULL,
        feedback TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(studentId) REFERENCES users(id),
        FOREIGN KEY(courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        scheduleId TEXT NOT NULL,
        status TEXT CHECK(status IN ('present', 'absent', 'late')) NOT NULL,
        date INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(studentId) REFERENCES users(id),
        FOREIGN KEY(scheduleId) REFERENCES schedules(id)
      );
    `);
    
    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schedules', schedulesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MQB Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function start() {
  const database = await initDatabase();
  
  // Store db in app.locals for use in routes
  app.locals.db = database;
  
  app.listen(PORT, () => {
    console.log(`🚀 MQB Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

start();
