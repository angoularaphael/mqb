import express from 'express';
import { verifyToken } from './auth.js';
import { v4 as uuid } from 'uuid';

const router = express.Router();

// Get all schedules
router.get('/', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const schedules = await db.all(
      `SELECT s.id, s.courseId, c.name as courseName, c.teacherId, u.firstName as teacherName, 
              s.dayOfWeek, s.startTime, s.endTime, s.room, s.created_at
       FROM schedules s
       JOIN courses c ON s.courseId = c.id
       JOIN users u ON c.teacherId = u.id
       ORDER BY s.dayOfWeek, s.startTime`
    );
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get schedules for a course
router.get('/course/:courseId', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const schedules = await db.all(
      'SELECT * FROM schedules WHERE courseId = ? ORDER BY dayOfWeek, startTime',
      req.params.courseId
    );
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create schedule (admin/teachers)
router.post('/', verifyToken, async (req, res) => {
  const { courseId, dayOfWeek, startTime, endTime, room } = req.body;
  const db = req.app.locals.db;

  if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Only teachers/admins can create schedules' });
  }

  try {
    const scheduleId = uuid();
    await db.run(
      'INSERT INTO schedules (id, courseId, dayOfWeek, startTime, endTime, room, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [scheduleId, courseId, dayOfWeek, startTime, endTime, room, Date.now()]
    );

    res.status(201).json({ id: scheduleId, message: 'Schedule created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update schedule
router.put('/:id', verifyToken, async (req, res) => {
  const { dayOfWeek, startTime, endTime, room } = req.body;
  const db = req.app.locals.db;

  if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await db.run(
      'UPDATE schedules SET dayOfWeek = ?, startTime = ?, endTime = ?, room = ? WHERE id = ?',
      [dayOfWeek, startTime, endTime, room, req.params.id]
    );

    res.json({ message: 'Schedule updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete schedule
router.delete('/:id', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await db.run('DELETE FROM schedules WHERE id = ?', req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
