import express from 'express';
import { verifyToken } from './auth.js';
import { v4 as uuid } from 'uuid';

const router = express.Router();

// Get all users (admin only)
router.get('/', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view all users' });
  }

  try {
    const users = await db.all(
      'SELECT id, email, firstName, lastName, role, created_at FROM users'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users by role (doit être avant /:id sinon "role" est capturé comme id)
router.get('/role/:role', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const users = await db.all(
      'SELECT id, email, firstName, lastName, role, created_at FROM users WHERE role = ?',
      req.params.role
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const user = await db.get(
      'SELECT id, email, firstName, lastName, role, created_at FROM users WHERE id = ?',
      req.params.id
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin or self)
router.put('/:id', verifyToken, async (req, res) => {
  const db = req.app.locals.db;
  const { firstName, lastName, role } = req.body;

  // Check permission
  if (req.userId !== req.params.id && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await db.run(
      'UPDATE users SET firstName = ?, lastName = ?, role = ?, updated_at = ? WHERE id = ?',
      [firstName, lastName, role, Date.now(), req.params.id]
    );

    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete users' });
  }

  try {
    await db.run('DELETE FROM users WHERE id = ?', req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
