const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const config = require('../config');

// GET /api/guruvandan/logs?date=YYYY-MM-DD - get log(s) for the current user
router.get('/logs', authenticateToken, (req, res) => {
  let logs;
  if (req.query.date) {
    logs = db.prepare('SELECT * FROM guruvandan_logs WHERE user_id = ? AND date = ?')
      .all(req.user.id, req.query.date);
  } else {
    logs = db.prepare('SELECT * FROM guruvandan_logs WHERE user_id = ? ORDER BY date DESC')
      .all(req.user.id);
  }
  res.json(logs);
});

// GET /api/guruvandan/summary - total guruvandans and recent daily counts
router.get('/summary', authenticateToken, (req, res) => {
  const totalGuruvandans = req.user.total_guruvandans;
  const dailyLogs = db.prepare(
    `SELECT date, count FROM guruvandan_logs WHERE user_id = ? AND date >= '${config.COMPETITION_START_DATE}' ORDER BY date DESC LIMIT 30`
  ).all(req.user.id);
  res.json({ totalGuruvandans, dailyLogs });
});

// POST /api/guruvandan/log - add a count for a date (accumulates onto the existing day's count)
router.post('/log', authenticateToken, (req, res) => {
  const { count, date } = req.body;
  const logDate = date || new Date().toISOString().split('T')[0];

  if (logDate < config.COMPETITION_START_DATE) {
    return res.status(400).json({ error: `Logs before ${config.COMPETITION_START_DISPLAY} are not accepted.` });
  }

  if (req.user.is_disqualified) {
    return res.status(403).json({ error: `You have been disqualified from the ${config.BRAND_NAME}.` });
  }

  const addCount = parseInt(count);
  if (!addCount || addCount <= 0) {
    return res.status(400).json({ error: 'A positive count is required' });
  }

  const existing = db.prepare('SELECT * FROM guruvandan_logs WHERE user_id = ? AND date = ?').get(req.user.id, logDate);

  let log;
  if (existing) {
    const newCount = existing.count + addCount;
    db.prepare('UPDATE guruvandan_logs SET count = ? WHERE id = ?').run(newCount, existing.id);
    log = { id: existing.id, user_id: req.user.id, date: logDate, count: newCount };
  } else {
    const result = db.prepare(
      'INSERT INTO guruvandan_logs (user_id, date, count) VALUES (?, ?, ?)'
    ).run(req.user.id, logDate, addCount);
    log = { id: result.lastInsertRowid, user_id: req.user.id, date: logDate, count: addCount };
  }
  db.prepare('UPDATE users SET total_guruvandans = total_guruvandans + ? WHERE id = ?').run(addCount, req.user.id);

  const updatedUser = db.prepare('SELECT total_guruvandans FROM users WHERE id = ?').get(req.user.id);
  res.json({ log, total_guruvandans: updatedUser.total_guruvandans });
});

// DELETE /api/guruvandan/log/:date - clear a day's count entirely
router.delete('/log/:date', authenticateToken, (req, res) => {
  const logEntry = db.prepare(
    'SELECT * FROM guruvandan_logs WHERE user_id = ? AND date = ?'
  ).get(req.user.id, req.params.date);

  if (!logEntry) {
    return res.status(404).json({ error: 'Log entry not found' });
  }

  db.prepare('DELETE FROM guruvandan_logs WHERE id = ?').run(logEntry.id);
  if (logEntry.date >= config.COMPETITION_START_DATE) {
    db.prepare('UPDATE users SET total_guruvandans = total_guruvandans - ? WHERE id = ?').run(
      logEntry.count, req.user.id
    );
  }

  const updatedUser = db.prepare('SELECT total_guruvandans FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, total_guruvandans: updatedUser.total_guruvandans });
});

module.exports = router;
