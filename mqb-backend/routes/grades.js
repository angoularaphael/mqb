import express from 'express';
import { verifyToken } from './auth.js';
import { v4 as uuid } from 'uuid';

const router = express.Router();

// Get grades for a student
router.get('/student/:studentId', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const grades = await db.all(
      `SELECT g.id, g.courseId, c.name as courseName, g.grade, g.feedback, g.created_at
       FROM grades g
       JOIN courses c ON g.courseId = c.id
       WHERE g.studentId = ? ORDER BY g.created_at DESC`,
      req.params.studentId
    );
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add grade (teachers only)
router.post('/', verifyToken, async (req, res) => {
  const { studentId, courseId, grade, feedback } = req.body;
  const db = req.app.locals.db;

  if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Only teachers can add grades' });
  }

  try {
    const gradeId = uuid();
    await db.run(
      'INSERT INTO grades (id, studentId, courseId, grade, feedback, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [gradeId, studentId, courseId, grade, feedback, Date.now()]
    );

    res.status(201).json({ id: gradeId, message: 'Grade added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update grade
router.put('/:id', verifyToken, async (req, res) => {
  const { grade, feedback } = req.body;
  const db = req.app.locals.db;

  if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await db.run(
      'UPDATE grades SET grade = ?, feedback = ? WHERE id = ?',
      [grade, feedback, req.params.id]
    );

    res.json({ message: 'Grade updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete grade
router.delete('/:id', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await db.run('DELETE FROM grades WHERE id = ?', req.params.id);
    res.json({ message: 'Grade deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
