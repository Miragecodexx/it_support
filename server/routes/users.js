const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const db = require('../database/db');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, requireAdmin, (req, res) => {
  const database = db.getDb();
  
  database.all(
    'SELECT id, email, name, role, department, phone, created_at FROM users ORDER BY name',
    [],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users);
    }
  );
});

// Get single user
router.get('/:id', authenticate, (req, res) => {
  const database = db.getDb();
  const userId = req.params.id;

  // Users can only see their own profile unless admin
  if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  database.get(
    'SELECT id, email, name, role, department, phone, created_at FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    }
  );
});

// Create user (admin only)
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { email, password, name, role, department, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const database = db.getDb();
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync(password, 10);

  database.run(
    'INSERT INTO users (email, password, name, role, department, phone) VALUES (?, ?, ?, ?, ?, ?)',
    [email, hashedPassword, name, role || 'user', department || null, phone || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        id: this.lastID,
        email,
        name,
        role: role || 'user',
        department,
        phone
      });
    }
  );
});

// Update user
router.put('/:id', authenticate, (req, res) => {
  const database = db.getDb();
  const userId = req.params.id;

  // Users can only update their own profile unless admin
  if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { name, department, phone, role } = req.body;
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (department !== undefined) {
    updates.push('department = ?');
    params.push(department);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone);
  }
  if (role !== undefined && req.user.role === 'admin') {
    updates.push('role = ?');
    params.push(role);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(userId);

  database.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    params,
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'User updated successfully' });
    }
  );
});

module.exports = router;
