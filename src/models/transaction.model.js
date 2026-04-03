const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const TransactionModel = {
  create({ amount, type, category, date, notes, createdBy }) {
    const id = uuidv4();
    db.prepare(
      `INSERT INTO transactions (id, amount, type, category, date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, amount, type, category, date, notes || null, createdBy);
    return this.findById(id);
  },

  findById(id) {
    return db
      .prepare(
        `SELECT t.*, u.name as creator_name
         FROM transactions t
         JOIN users u ON t.created_by = u.id
         WHERE t.id = ? AND t.is_deleted = 0`
      )
      .get(id);
  },

  findAll({
    page = 1,
    limit = 20,
    type,
    category,
    dateFrom,
    dateTo,
    search,
    sortBy = 'date',
    sortOrder = 'DESC',
  } = {}) {
    const offset = (page - 1) * limit;
    const conditions = ['t.is_deleted = 0'];
    const params = [];

    if (type)     { conditions.push('t.type = ?');       params.push(type); }
    if (category) { conditions.push('t.category = ?');   params.push(category); }
    if (dateFrom) { conditions.push('t.date >= ?');      params.push(dateFrom); }
    if (dateTo)   { conditions.push('t.date <= ?');      params.push(dateTo); }
    if (search) {
      conditions.push('(t.category LIKE ? OR t.notes LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    
    const allowedSortCols = ['date', 'amount', 'created_at', 'type', 'category'];
    const col   = allowedSortCols.includes(sortBy) ? sortBy : 'date';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const transactions = db
      .prepare(
        `SELECT t.*, u.name as creator_name
         FROM transactions t
         JOIN users u ON t.created_by = u.id
         ${where}
         ORDER BY t.${col} ${order}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    const { total } = db
      .prepare(
        `SELECT COUNT(*) as total
         FROM transactions t ${where}`
      )
      .get(...params);

    return { transactions, total, page, limit };
  },

  patch(id, fields) {
    const allowed = ['amount', 'type', 'category', 'date', 'notes'];
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
      `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ? AND is_deleted = 0`
    ).run(...values, id);

    return this.findById(id);
  },

  
  softDelete(id) {
    const result = db
      .prepare(
        `UPDATE transactions
         SET is_deleted = 1, updated_at = datetime('now')
         WHERE id = ? AND is_deleted = 0`
      )
      .run(id);
    return result.changes > 0;
  },

  exists(id) {
    return !!db
      .prepare('SELECT id FROM transactions WHERE id = ? AND is_deleted = 0')
      .get(id);
  },
};

module.exports = TransactionModel;
