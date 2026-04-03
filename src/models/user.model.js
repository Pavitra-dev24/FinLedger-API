const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const UserModel = {
  create({ name, email, password, role = 'viewer' }) {
    const id = uuidv4();
    db.prepare(
      `INSERT INTO users (id, name, email, password, role)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, name, email, password, role);
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findAll({ page = 1, limit = 20, role, status } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (role)   { conditions.push('role = ?');   params.push(role); }
    if (status) { conditions.push('status = ?'); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const users = db
      .prepare(
        `SELECT id, name, email, role, status, created_at, updated_at
         FROM users ${where}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    const { total } = db
      .prepare(`SELECT COUNT(*) as total FROM users ${where}`)
      .get(...params);

    return { users, total, page, limit };
  },

  update(id, fields) {
    const allowed = ['name', 'email', 'password', 'role', 'status'];
    const updates = Object.keys(fields)
      .filter((k) => allowed.includes(k) && fields[k] !== undefined)
      .map((k) => `${k} = ?`);

    if (updates.length === 0) return this.findById(id);

    const values = updates.map((u) => fields[u.split(' ')[0]]);

    db.prepare(
      `UPDATE users
       SET ${updates.join(', ')}, updated_at = datetime('now')
       WHERE id = ?`
    ).run(...values, id);

    return this.findById(id);
  },

  
  patch(id, fields) {
    const allowed = ['name', 'email', 'password', 'role', 'status'];
    const setClauses = [];
    const values = [];

    for (const key of allowed) {
      if (key in fields) {
        setClauses.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push("updated_at = datetime('now')");

    db.prepare(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`
    ).run(...values, id);

    return this.findById(id);
  },

  
  sanitize(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  },
};

module.exports = UserModel;
