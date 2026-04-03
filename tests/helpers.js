process.env.DB_PATH     = ':memory:';
process.env.JWT_SECRET  = 'test-jwt-secret-key';
process.env.NODE_ENV    = 'test';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const app     = require('../src/app');
const db      = require('../src/config/database');
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

function resetDb() {
  db.exec(`
    DELETE FROM transactions;
    DELETE FROM users;
  `);
}

async function createUserAndLogin(overrides = {}) {
  const defaults = {
    id:       uuidv4(),
    name:     'Test User',
    email:    `user_${Date.now()}@test.com`,
    password: 'Password123',
    role:     'viewer',
    status:   'active',
  };
  const userData = { ...defaults, ...overrides };
  const hashed   = await bcrypt.hash(userData.password, 4); 

  db.prepare(
    `INSERT INTO users (id, name, email, password, role, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userData.id, userData.name, userData.email, hashed, userData.role, userData.status);

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: userData.email, password: userData.password });

  return {
    user:  res.body.data.user,
    token: res.body.data.token,
    raw:   userData,
  };
}

module.exports = { request, app, db, resetDb, createUserAndLogin };
