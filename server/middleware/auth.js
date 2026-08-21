const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (user.is_deleted) {
      return res.status(403).json({ error: 'Account deactivated.' });
    }
    req.user = user;
    // is_admin is determined by how they logged in, not the DB flag
    req.isAdmin = decoded.loginType === 'admin';
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requirePaid(req, res, next) {
  if (!req.isAdmin && !req.user.registration_fee_paid) {
    return res.status(403).json({ error: `Registration fee of ${config.REGISTRATION_FEE_DISPLAY} must be paid to access this.` });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, requirePaid };
