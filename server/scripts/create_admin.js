const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Usage:
//   node create_admin.js email@example.com MyP@ssw0rd
// or set env vars ADMIN_EMAIL and ADMIN_PASSWORD and run the script.

const email = process.env.ADMIN_EMAIL || process.argv[2];
const password = process.env.ADMIN_PASSWORD || process.argv[3];

if (!email || !password) {
  console.error('Usage: node create_admin.js <email> <password>');
  process.exit(1);
}

const DB_PATH = path.join(__dirname, '..', 'database', 'support.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
  }
});

const hashed = bcrypt.hashSync(password, 10);

db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
  if (err) {
    console.error('DB error:', err);
    process.exit(1);
  }

  if (row) {
    db.run('UPDATE users SET password = ?, role = ? WHERE id = ?', [hashed, 'admin', row.id], (uerr) => {
      if (uerr) {
        console.error('Update error:', uerr);
        process.exit(1);
      }
      console.log(`Updated existing user ${email} and set role=admin.`);
      db.close();
    });
  } else {
    db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [email, hashed, 'Admin', 'admin'], (ierr) => {
      if (ierr) {
        console.error('Insert error:', ierr);
        process.exit(1);
      }
      console.log(`Created admin user ${email}.`);
      db.close();
    });
  }
});
