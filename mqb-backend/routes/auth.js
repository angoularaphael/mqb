import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

const router = express.Router();

// Middleware to verify JWT
export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Login
router.post('/login', async (req, res) => {
  const { email, password, portalType } = req.body;
  const db = req.app.locals.db;

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcryptjs.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (portalType && user.role !== 'admin') {
      if (portalType === 'student' && user.role !== 'student') {
        return res.status(403).json({ error: 'Accès non autorisé au portail étudiant' });
      }
      if (portalType === 'teacher' && user.role !== 'teacher') {
        return res.status(403).json({ error: 'Accès non autorisé au portail enseignant' });
      }
    }


    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register (admin only)
router.post('/register', verifyToken, async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  const db = req.app.locals.db;

  // Check if user is admin
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admins can register users' });
  }

  try {
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const userId = uuid();

    await db.run(
      'INSERT INTO users (id, email, firstName, lastName, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, email, firstName, lastName, hashedPassword, role, Date.now(), Date.now()]
    );

    res.status(201).json({
      message: 'User created successfully',
      userId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const user = await db.get('SELECT id, email, firstName, lastName, role FROM users WHERE id = ?', req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
