const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../email');
const config = require('../config');

function assignGroup(age) {
  if (age >= 5 && age <= 15) return '1';
  if (age >= 15 && age <= 25) return '2';
  if (age >= 26 && age <= 60) return '3';
  return '3';
}

function makeToken(userId, loginType) {
  return jwt.sign({ userId, loginType }, config.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register — always a regular user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, age, phone, address, city, state, zipcode } = req.body;

    if (!name || !email || !password || !age) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (age < 5 || age > 60) {
      return res.status(400).json({ error: 'Age must be between 5 and 50' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const group_num = assignGroup(parseInt(age));

    const result = db.prepare(
      'INSERT INTO users (name, email, password, age, group_num, phone, address, city, state, zipcode, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, email, hashedPassword, parseInt(age), group_num, phone || '', address || '', city || '', state || '', zipcode || '', 0);

    const token = makeToken(result.lastInsertRowid, 'user');

    const newUser = {
      id: result.lastInsertRowid,
      name,
      email,
      age: parseInt(age),
      group_num,
      phone: phone || '',
      address: address || '',
      city: city || '',
      state: state || '',
      zipcode: zipcode || '',
      total_points: 0,
      registration_fee_paid: 0,
      is_admin: 0,
    };

    // Send welcome email (non-blocking)
    sendWelcomeEmail(newUser);

    res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login — regular users only, is_admin always 0
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) ORDER BY is_deleted ASC LIMIT 1').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.is_deleted) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = makeToken(user.id, 'user');

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        group_num: user.group_num,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipcode: user.zipcode || '',
        total_points: user.total_points,
        registration_fee_paid: user.registration_fee_paid,
        is_admin: 0
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me — returns is_admin based on token type, not DB
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    age: req.user.age,
    group_num: req.user.group_num,
    phone: req.user.phone || '',
    address: req.user.address || '',
    city: req.user.city || '',
    state: req.user.state || '',
    zipcode: req.user.zipcode || '',
    total_points: req.user.total_points,
    registration_fee_paid: req.user.registration_fee_paid || 0,
    razorpay_payment_id: req.user.razorpay_payment_id || '',
    is_disqualified: req.user.is_disqualified || 0,
    is_admin: req.isAdmin ? 1 : 0    // from JWT loginType, not DB
  });
});

// PUT /api/auth/profile — update own address details
router.put('/profile', authenticateToken, (req, res) => {
  const { name, phone, address, city, state, zipcode } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  db.prepare(
    'UPDATE users SET name = ?, phone = ?, address = ?, city = ?, state = ?, zipcode = ? WHERE id = ?'
  ).run(name.trim(), phone || '', address || '', city || '', state || '', zipcode || '', req.user.id);
  res.json({
    id: req.user.id,
    name: name.trim(),
    email: req.user.email,
    age: req.user.age,
    group_num: req.user.group_num,
    phone: phone || '',
    address: address || '',
    city: city || '',
    state: state || '',
    zipcode: zipcode || '',
    total_points: req.user.total_points,
    is_admin: req.isAdmin ? 1 : 0
  });
});

// POST /api/auth/admin-login — admins only, issues admin-type token
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) ORDER BY is_deleted ASC LIMIT 1').get(email);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Invalid admin credentials' });
    }
    if (user.is_deleted) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(403).json({ error: 'Invalid admin credentials' });
    }

    const token = makeToken(user.id, 'admin');

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        group_num: user.group_num,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipcode: user.zipcode || '',
        total_points: user.total_points,
        registration_fee_paid: user.registration_fee_paid,
        is_admin: 1
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/password — change own password (requires current password)
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const valid = await bcrypt.compare(currentPassword, req.user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/forgot-password — send reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Always respond the same way to prevent user enumeration
  const user = db.prepare('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER(?) AND is_deleted = 0').get(email);
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
    db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);
    sendPasswordResetEmail(user, token);
  }

  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

// POST /api/auth/reset-password — set new password using token
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const record = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0').get(token);
  if (!record) return res.status(400).json({ error: 'Invalid or expired reset link' });
  if (Date.now() > record.expires_at) {
    db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(record.id);
    return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, record.user_id);
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(record.id);

  res.json({ message: 'Password reset successfully. You can now sign in.' });
});

module.exports = router;
