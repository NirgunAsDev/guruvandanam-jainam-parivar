// Script to delete all bumper activity logs and recalculate user points
// Usage: node server/clear-bumper-points.js
//        (run from the project root, or from inside the server/ folder)

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'aaradhna.db');
const db = new Database(DB_PATH);

const BUMPER_IDS = [
  'navpad_oli',
  'vardhman_tap',
  'parva_pousadh',
  'mahavir_janm_kalyanak',
  'shasan_sthapna',
  'bakri_eid_ayambil',
  'mango_tyag',
];

const placeholders = BUMPER_IDS.map(() => '?').join(', ');

// Count how many logs will be deleted
const count = db.prepare(
  `SELECT COUNT(*) as n FROM activity_logs WHERE activity_id IN (${placeholders})`
).get(...BUMPER_IDS).n;

if (count === 0) {
  console.log('No bumper point logs found. Nothing to delete.');
  process.exit(0);
}

console.log(`Found ${count} bumper point log(s). Deleting...`);

// Delete all bumper logs in one transaction and recalculate user points
db.transaction(() => {
  // Get affected user IDs before deleting
  const affectedUsers = db.prepare(
    `SELECT DISTINCT user_id FROM activity_logs WHERE activity_id IN (${placeholders})`
  ).all(...BUMPER_IDS).map(r => r.user_id);

  // Delete the bumper logs
  const deleted = db.prepare(
    `DELETE FROM activity_logs WHERE activity_id IN (${placeholders})`
  ).run(...BUMPER_IDS);

  console.log(`Deleted ${deleted.changes} log(s).`);

  // Recalculate total_points for each affected user
  for (const userId of affectedUsers) {
    const result = db.prepare(
      'SELECT COALESCE(SUM(points_earned), 0) as total FROM activity_logs WHERE user_id = ?'
    ).get(userId);
    db.prepare('UPDATE users SET total_points = ? WHERE id = ?')
      .run(result.total, userId);
  }

  console.log(`Recalculated points for ${affectedUsers.length} user(s).`);
})();

console.log('Done.');
db.close();
