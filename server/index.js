require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const config = require('./config');
const authRoutes = require('./routes/auth');
const guruvandanRoutes = require('./routes/guruvandan');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configure S3 client (will auto-use env vars if standard)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});
const upload = multer({ storage: multer.memoryStorage() }); // No size limit


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Payment routes MUST be mounted before express.json() so the webhook
// endpoint can read the raw request body for signature verification
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/guruvandan', guruvandanRoutes);

const { authenticateToken, requireAdmin } = require('./middleware/auth');

// Leaderboard
app.get('/api/leaderboard', authenticateToken, (req, res) => {
  const users = db.prepare(
    'SELECT id, name, age, group_num, total_guruvandans FROM users WHERE is_deleted = 0 AND is_disqualified = 0 ORDER BY total_guruvandans DESC LIMIT 50'
  ).all();
  res.json(users);
});

// Admin: list all users
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const showDeleted = req.query.deleted === '1';
  const showDisqualified = req.query.disqualified === '1';

  const columns = `id, name, email, age, group_num, total_guruvandans, is_admin, registration_fee_paid,
                    phone, address, city, state, zipcode, sangh_name, mahatma_name, mahatma_thana, created_at, is_deleted, is_disqualified`;

  let whereClause;
  if (showDeleted) {
    whereClause = 'WHERE is_deleted = 1';
  } else if (showDisqualified) {
    whereClause = 'WHERE is_deleted = 0 AND is_disqualified = 1';
  } else {
    whereClause = 'WHERE is_deleted = 0 AND is_disqualified = 0';
  }
  const query = `SELECT ${columns} FROM users ${whereClause} ORDER BY total_guruvandans DESC`;

  res.json(db.prepare(query).all());
});

// Admin: toggle fee paid
app.put('/api/admin/users/:id/fee', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { paid } = req.body;
  db.prepare('UPDATE users SET registration_fee_paid = ? WHERE id = ?').run(paid ? 1 : 0, id);
  res.json({ success: true });
});

// Admin: soft delete / undelete user
app.put('/api/admin/users/:id/delete', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { is_deleted } = req.body;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }
  const result = db.prepare('UPDATE users SET is_deleted = ? WHERE id = ?').run(is_deleted ? 1 : 0, id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true });
});

// Admin: toggle admin
app.put('/api/admin/users/:id/admin', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { is_admin } = req.body;
  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(is_admin ? 1 : 0, id);
  res.json({ success: true });
});

// Admin: disqualify / re-qualify user
app.put('/api/admin/users/:id/disqualify', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { is_disqualified } = req.body;
  const result = db.prepare('UPDATE users SET is_disqualified = ? WHERE id = ?').run(is_disqualified ? 1 : 0, id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true });
});

// Admin: reset user password
const bcrypt = require('bcryptjs');
app.put('/api/admin/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const result = db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true });
});

// Admin: get all guruvandan logs for a user (date-wise)
app.get('/api/admin/users/:id/logs', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const logs = db.prepare(
    `SELECT id, date, count
     FROM guruvandan_logs WHERE user_id = ? AND date >= '${config.COMPETITION_START_DATE}'
     ORDER BY date DESC`
  ).all(id);
  res.json(logs);
});

// Admin: get guruvandan summary for a specific user
app.get('/api/admin/users/:id/summary', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const user = db.prepare(
    'SELECT id, name, email, age, group_num, phone, address, city, state, zipcode, sangh_name, mahatma_name, mahatma_thana, total_guruvandans, registration_fee_paid, created_at, is_disqualified FROM users WHERE id = ?'
  ).get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const dailyLogs = db.prepare(
    `SELECT date, count FROM guruvandan_logs WHERE user_id = ? AND date >= '${config.COMPETITION_START_DATE}'
     ORDER BY date DESC LIMIT 30`
  ).all(id);

  res.json({ user, dailyLogs });
});

// Public: get landing video URL
app.get('/api/settings/landing-video', (req, res) => {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'landing_video_url'").get();
  res.json({ landing_video_url: row ? row.value : '' });
});

// Admin: upload landing video to S3
app.post('/api/admin/settings/upload-video', authenticateToken, requireAdmin, upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
  if (!bucketName || !cloudfrontDomain) {
    return res.status(500).json({ error: 'S3/CloudFront environment variables not configured' });
  }

  const objectKey = `landing-video.mp4`; // Fixed name, overwrites previous
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || 'video/mp4',
    });
    
    await s3Client.send(command);

    // Add cache buster query parameter to force video refresh on clients
    const finalUrl = `${cloudfrontDomain}/${objectKey}?v=${Date.now()}`;
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('landing_video_url', ?)").run(finalUrl);
    res.json({ success: true, landing_video_url: finalUrl });
  } catch (err) {
    console.error('S3 Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload video to S3' });
  }
});

// Admin: Remove landing video
app.delete('/api/admin/settings/remove-video', authenticateToken, requireAdmin, async (req, res) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (bucketName) {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: 'landing-video.mp4'
      }));
    } catch (e) {
      console.error('Failed to delete S3 object, but continuing DB clear:', e);
    }
  }
  db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('landing_video_url', '')").run();
  res.json({ success: true });
});


app.listen(PORT, () => {
  console.log(`${config.BRAND_NAME} server running on port ${PORT}`);
});
