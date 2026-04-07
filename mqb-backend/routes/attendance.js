import express from 'express';
import { verifyToken } from './auth.js';
import { v4 as uuid } from 'uuid';

const router = express.Router();

// Get attendance for a student
router.get('/student/:studentId', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const attendance = await db.all(
      `SELECT a.id, a.scheduleId, a.status, a.date, a.created_at, s.courseId
       FROM attendance a
       JOIN schedules s ON a.scheduleId = s.id
       WHERE a.studentId = ? ORDER BY a.date DESC`,
      req.params.studentId
    );
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance for a schedule
router.get('/schedule/:scheduleId', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const attendance = await db.all(
      `SELECT a.id, a.studentId, u.firstName, u.lastName, a.status, a.date
       FROM attendance a
       JOIN users u ON a.studentId = u.id
       WHERE a.scheduleId = ? ORDER BY a.date DESC`,
      req.params.scheduleId
    );
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark attendance
router.post('/', verifyToken, async (req, res) => {
  const { studentId, scheduleId, status } = req.body;
  const db = req.app.locals.db;

  if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Only teachers can mark attendance' });
  }

  try {
    const attendanceId = uuid();
    const date = Math.floor(new Date().getTime() / 1000); // Unix timestamp in seconds
    
    await db.run(
      'INSERT INTO attendance (id, studentId, scheduleId, status, date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [attendanceId, studentId, scheduleId, status, date, Date.now()]
    );

    res.status(201).json({ id: attendanceId, message: 'Attendance marked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update attendance
router.put('/:id', verifyToken, async (req, res) => {
  const { status } = req.body;
  const db = req.app.locals.db;

  if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await db.run(
      'UPDATE attendance SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    res.json({ message: 'Attendance updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
