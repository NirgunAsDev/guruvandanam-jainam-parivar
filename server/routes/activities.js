const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { activities, getActivityById, calculatePoints } = require('../activities');
const config = require('../config');

// GET /api/activities - return activities for user's group + common + bumper
router.get('/', authenticateToken, (req, res) => {
  const group = req.user.group_num;
  const filtered = activities.filter(
    a => a.group === group || a.group === 'common' || a.group === 'bumper'
  );
  res.json(filtered);
});

// GET /api/activities/all - return all activities (for reference)
router.get('/all', (req, res) => {
  res.json(activities);
});

// GET /api/activities/logs?date=YYYY-MM-DD - get logs for a date (omit date for all logs)
router.get('/logs', authenticateToken, (req, res) => {
  let logs;
  if (req.query.date) {
    logs = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? AND date = ? AND is_discarded = 0')
              .all(req.user.id, req.query.date);
  } else {
    logs = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? AND is_discarded = 0')
              .all(req.user.id);
  }
  res.json(logs);
});

// GET /api/activities/summary - total points and logs per activity
router.get('/summary', authenticateToken, (req, res) => {
  const totalPoints = req.user.total_points;
  const dailyLogs = db.prepare(
    `SELECT date, SUM(points_earned) as daily_points FROM activity_logs WHERE user_id = ? AND date >= '${config.COMPETITION_START_DATE}' AND is_discarded = 0 GROUP BY date ORDER BY date DESC LIMIT 30`
  ).all(req.user.id);
  const activityBreakdown = db.prepare(
    `SELECT activity_id, SUM(points_earned) as total, COUNT(*) as days FROM activity_logs WHERE user_id = ? AND date >= '${config.COMPETITION_START_DATE}' AND is_discarded = 0 GROUP BY activity_id ORDER BY total DESC`
  ).all(req.user.id);
  res.json({ totalPoints, dailyLogs, activityBreakdown });
});

// POST /api/activities/log - log or update an activity for today
router.post('/log', authenticateToken, (req, res) => {
  const { activity_id, quantity, date } = req.body;
  const logDate = date || new Date().toISOString().split('T')[0];

  if (logDate < config.COMPETITION_START_DATE) {
    return res.status(400).json({ error: `Logs before ${config.COMPETITION_START_DISPLAY} are not accepted.` });
  }

  const istToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (istToday > config.COMPETITION_END_DATE) {
    return res.status(400).json({ error: `The ${config.BRAND_NAME} program has ended on ${config.COMPETITION_END_DISPLAY}.` });
  }

  if (req.user.is_disqualified) {
    return res.status(403).json({ error: `You have been disqualified from the ${config.BRAND_NAME}.` });
  }

  if (!activity_id) {
    return res.status(400).json({ error: 'activity_id is required' });
  }

  const activity = getActivityById(activity_id);
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  const qty = quantity ?? 1;
  const points = calculatePoints(activity, qty);

  // Check if a non-discarded log exists for this date
  const existing = db.prepare(
    'SELECT * FROM activity_logs WHERE user_id = ? AND activity_id = ? AND date = ? AND is_discarded = 0'
  ).get(req.user.id, activity_id, logDate);

  let log;
  if (existing) {
    // Update existing log
    db.prepare(
      'UPDATE activity_logs SET quantity = ?, points_earned = ? WHERE id = ?'
    ).run(qty, points, existing.id);
    // Adjust total_points
    db.prepare(
      'UPDATE users SET total_points = total_points - ? + ? WHERE id = ?'
    ).run(existing.points_earned, points, req.user.id);
    log = { id: existing.id, activity_id, date: logDate, quantity: qty, points_earned: points };
  } else {
    // Insert new log
    const result = db.prepare(
      'INSERT INTO activity_logs (user_id, activity_id, date, quantity, points_earned) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, activity_id, logDate, qty, points);
    db.prepare('UPDATE users SET total_points = total_points + ? WHERE id = ?').run(points, req.user.id);
    log = { id: result.lastInsertRowid, activity_id, date: logDate, quantity: qty, points_earned: points };
  }

  const updatedUser = db.prepare('SELECT total_points FROM users WHERE id = ?').get(req.user.id);
  res.json({ log, total_points: updatedUser.total_points });
});

// DELETE /api/activities/log/:id - remove a log
router.delete('/log/:id', authenticateToken, (req, res) => {
  const logEntry = db.prepare(
    'SELECT * FROM activity_logs WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!logEntry) {
    return res.status(404).json({ error: 'Log entry not found' });
  }

  db.prepare('DELETE FROM activity_logs WHERE id = ?').run(logEntry.id);
  if (logEntry.date >= config.COMPETITION_START_DATE) {
    db.prepare('UPDATE users SET total_points = total_points - ? WHERE id = ?').run(
      logEntry.points_earned, req.user.id
    );
  }

  const updatedUser = db.prepare('SELECT total_points FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, total_points: updatedUser.total_points });
});

module.exports = router;
