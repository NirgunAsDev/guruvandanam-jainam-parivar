const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config');

const db = new Database(path.join(__dirname, 'aaradhna.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    age INTEGER NOT NULL,
    group_num TEXT NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    zipcode TEXT DEFAULT '',
    total_points INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    registration_fee_paid INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_id TEXT NOT NULL,
    date TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    points_earned INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, activity_id, date)
  );
`);

// Add address columns to existing databases that predate this migration
for (const col of ['phone', 'address', 'city', 'state', 'zipcode']) {
  try { db.exec(`ALTER TABLE users ADD COLUMN ${col} TEXT DEFAULT ''`); } catch (_) {}
}
try { db.exec(`ALTER TABLE users ADD COLUMN is_deleted INTEGER DEFAULT 0`); } catch (_) {}
try { db.exec(`ALTER TABLE users ADD COLUMN is_disqualified INTEGER DEFAULT 0`); } catch (_) {}
try { db.exec(`ALTER TABLE activity_logs ADD COLUMN is_discarded INTEGER DEFAULT 0`); } catch (_) {}

// Razorpay payment columns
try { db.exec(`ALTER TABLE users ADD COLUMN razorpay_payment_id TEXT DEFAULT ''`); } catch (_) {}
try { db.exec(`ALTER TABLE users ADD COLUMN pending_order_id TEXT DEFAULT ''`); } catch (_) {}
try { db.exec(`ALTER TABLE users ADD COLUMN pending_order_at INTEGER DEFAULT 0`); } catch (_) {}

// Password reset tokens
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
} catch (_) {}

// App-wide settings (key-value store)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    )
  `);
  db.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('landing_video_url', '')").run();
} catch (_) {}

// Unique index: prevent same payment_id being linked to multiple users
try {
  db.exec(`CREATE UNIQUE INDEX idx_payment_id_unique ON users(razorpay_payment_id) WHERE razorpay_payment_id != ''`);
} catch (_) {}

// Recalculate total_points for all users counting only non-discarded logs on/after competition start
db.exec(`
  UPDATE users SET total_points = (
    SELECT COALESCE(SUM(points_earned), 0)
    FROM activity_logs
    WHERE user_id = users.id AND date >= '${config.COMPETITION_START_DATE}' AND is_discarded = 0
  )
`);

// Financial audit trail
db.exec(`
  CREATE TABLE IF NOT EXISTS payment_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_id TEXT DEFAULT '',
    payment_id TEXT DEFAULT '',
    event TEXT NOT NULL,
    status TEXT DEFAULT '',
    reason TEXT DEFAULT '',
    raw_payload TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default admin if not exists
const bcrypt = require('bcryptjs');
const adminEmail = config.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';

const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  const hashed = bcrypt.hashSync(adminPassword, 10);
  db.prepare(
    'INSERT INTO users (name, email, password, age, group_num, is_admin, registration_fee_paid) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('Administrator', adminEmail, hashed, 30, '3', 1, 1);
  console.log(`Default admin created — email: ${adminEmail}  password: ${adminPassword}`);
}

module.exports = db;
