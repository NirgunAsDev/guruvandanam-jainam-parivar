// Wipes all participant/competition data (users, guruvandan logs, payment
// history, password reset tokens) while leaving admin accounts intact so
// admins can still log in afterwards.
//
// Usage: node scripts/reset-data.js --yes

const db = require('../db');

if (!process.argv.includes('--yes')) {
  console.error('Refusing to run without --yes — this permanently deletes all non-admin data.');
  console.error('Usage: node scripts/reset-data.js --yes');
  process.exit(1);
}

const adminCount = db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_admin = 1').get().n;
if (adminCount === 0) {
  console.error('No admin account found — aborting so you are never locked out.');
  process.exit(1);
}

const counts = {
  users: db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_admin = 0').get().n,
  guruvandan_logs: db.prepare('SELECT COUNT(*) AS n FROM guruvandan_logs').get().n,
  password_reset_tokens: db.prepare('SELECT COUNT(*) AS n FROM password_reset_tokens').get().n,
  payment_logs: db.prepare('SELECT COUNT(*) AS n FROM payment_logs').get().n,
};

const reset = db.transaction(() => {
  db.prepare('DELETE FROM guruvandan_logs').run();
  db.prepare('DELETE FROM password_reset_tokens').run();
  db.prepare('DELETE FROM payment_logs').run();
  db.prepare('DELETE FROM users WHERE is_admin = 0').run();

  // Admin accounts keep their login, but their own stats/pending payment
  // state are cleared too since all logs/payments were just wiped.
  db.prepare(`
    UPDATE users
    SET total_guruvandans = 0,
        pending_order_id = '',
        pending_order_at = 0
    WHERE is_admin = 1
  `).run();
});

reset();

console.log('Data reset complete. Deleted:');
console.log(`  users (non-admin):     ${counts.users}`);
console.log(`  guruvandan_logs:       ${counts.guruvandan_logs}`);
console.log(`  password_reset_tokens: ${counts.password_reset_tokens}`);
console.log(`  payment_logs:          ${counts.payment_logs}`);
console.log(`Admin accounts kept: ${adminCount}`);
