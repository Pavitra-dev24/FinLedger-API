require('dotenv').config();
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db      = require('../src/config/database');

const randomBetween = (min, max) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(2));

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomDate = (daysAgo = 365) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString().split('T')[0];
};

const USERS = [
  {
    id:    uuidv4(),
    name:  'Alice Admin',
    email: 'admin@finledger.dev',
    password: 'Admin1234',
    role: 'admin',
  },
  {
    id:    uuidv4(),
    name:  'Bob Analyst',
    email: 'analyst@finledger.dev',
    password: 'Analyst1234',
    role: 'analyst',
  },
  {
    id:    uuidv4(),
    name:  'Carol Viewer',
    email: 'viewer@finledger.dev',
    password: 'Viewer1234',
    role: 'viewer',
  },
];

const INCOME_CATEGORIES = [
  'salary', 'freelance', 'investment', 'rental', 'other_income',
];

const EXPENSE_CATEGORIES = [
  'food', 'housing', 'transport', 'utilities', 'healthcare',
  'entertainment', 'education', 'shopping', 'travel', 'other_expense',
];

const INCOME_NOTES = [
  'Monthly salary deposit',
  'Client project payment',
  'Dividend payout',
  'Rental income — unit 4B',
  'Freelance contract milestone',
  'Quarterly bonus',
  'Part-time consulting fee',
];

const EXPENSE_NOTES = [
  'Grocery run',
  'Monthly rent',
  'Fuel refill',
  'Electricity bill',
  'Doctor visit co-pay',
  'Netflix + Spotify',
  'Online course subscription',
  'New laptop accessories',
  'Weekend trip to Manali',
  'Miscellaneous household items',
];

async function seed() {
  console.log('🌱 Starting seed...');

  
  
  console.log('  ⏳ Hashing passwords...');
  const hashedUsers = await Promise.all(
    USERS.map(async (u) => ({
      ...u,
      password: await bcrypt.hash(u.password, 12),
    }))
  );
  console.log('  ✓ Passwords hashed');

  
  
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM users').run();
    console.log('  ✓ Cleared existing records');

    const insertUser = db.prepare(
      `INSERT INTO users (id, name, email, password, role)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (const user of hashedUsers) {
      insertUser.run(user.id, user.name, user.email, user.password, user.role);
      console.log(`  ✓ Created user: ${user.email} [${user.role}]`);
    }

    const adminId = hashedUsers[0].id;
    const insertTx = db.prepare(
      `INSERT INTO transactions (id, amount, type, category, date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < 60; i++) {
      const type = Math.random() < 0.4 ? 'income' : 'expense';
      insertTx.run(
        uuidv4(),
        type === 'income' ? randomBetween(5000, 80000) : randomBetween(200, 15000),
        type,
        type === 'income' ? randomItem(INCOME_CATEGORIES) : randomItem(EXPENSE_CATEGORIES),
        randomDate(365),
        type === 'income' ? randomItem(INCOME_NOTES) : randomItem(EXPENSE_NOTES),
        adminId
      );
    }

    db.exec('COMMIT');
    console.log('  ✓ Inserted 60 transactions');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  console.log(`
✅ Seed complete!

Demo credentials
─────────────────────────────────────
Role     Email                    Password
────     ─────                    ────────
admin    admin@finledger.dev      Admin1234
analyst  analyst@finledger.dev    Analyst1234
viewer   viewer@finledger.dev     Viewer1234
─────────────────────────────────────
  `);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
