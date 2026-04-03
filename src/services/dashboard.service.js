const db = require('../config/database');

const DashboardService = {
  
  getSummary() {
    const row = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
           COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                             WHEN type = 'expense' THEN -amount END), 0) AS net_balance,
           COUNT(*) AS transaction_count
         FROM transactions
         WHERE is_deleted = 0`
      )
      .get();

    return row;
  },

  
  getCategoryBreakdown() {
    return db
      .prepare(
        `SELECT
           category,
           type,
           ROUND(SUM(amount), 2) AS total,
           COUNT(*)              AS count
         FROM transactions
         WHERE is_deleted = 0
         GROUP BY category, type
         ORDER BY total DESC`
      )
      .all();
  },

  
  getMonthlyTrend() {
    const rows = db
      .prepare(
        `SELECT
           strftime('%Y-%m', date)                                         AS month,
           ROUND(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 2) AS income,
           ROUND(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 2) AS expenses,
           ROUND(SUM(CASE WHEN type='income'  THEN  amount
                          WHEN type='expense' THEN -amount END), 2)       AS net
         FROM transactions
         WHERE is_deleted = 0
           AND date >= date('now', '-11 months', 'start of month')
         GROUP BY month
         ORDER BY month ASC`
      )
      .all();

    
    const byMonth = Object.fromEntries(rows.map((r) => [r.month, r]));

    
    const now = new Date();
    const series = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      series.push(
        byMonth[key] ?? { month: key, income: 0, expenses: 0, net: 0 }
      );
    }
    return series;
  },

  
  getWeeklyTrend() {
    const rows = db
      .prepare(
        `SELECT
           strftime('%Y-W%W', date)                                        AS week,
           ROUND(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 2) AS income,
           ROUND(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 2) AS expenses
         FROM transactions
         WHERE is_deleted = 0
           AND date >= date('now', '-56 days')
         GROUP BY week
         ORDER BY week ASC`
      )
      .all();

    const byWeek = Object.fromEntries(rows.map((r) => [r.week, r]));

    
    const series = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      
      const weekNum = _sqliteWeekNumber(d);
      const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      series.push(
        byWeek[key] ?? { week: key, income: 0, expenses: 0 }
      );
    }
    return series;
  },

  
  getRecentActivity(limit = 10) {
    const n = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    return db
      .prepare(
        `SELECT t.id, t.amount, t.type, t.category, t.date, t.notes,
                u.name AS creator_name
         FROM transactions t
         JOIN users u ON t.created_by = u.id
         WHERE t.is_deleted = 0
         ORDER BY t.date DESC, t.created_at DESC
         LIMIT ?`
      )
      .all(n);
  },

  
  getTopSpendingCategories(limit = 5) {
    const n = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
    return db
      .prepare(
        `SELECT
           category,
           ROUND(SUM(amount), 2) AS total,
           COUNT(*)              AS count
         FROM transactions
         WHERE is_deleted = 0 AND type = 'expense'
         GROUP BY category
         ORDER BY total DESC
         LIMIT ?`
      )
      .all(n);
  },

  
  getFullDashboard(options = {}) {
    return {
      summary:              this.getSummary(),
      category_breakdown:   this.getCategoryBreakdown(),
      monthly_trend:        this.getMonthlyTrend(),
      weekly_trend:         this.getWeeklyTrend(),
      recent_activity:      this.getRecentActivity(options.recentLimit),
      top_spending:         this.getTopSpendingCategories(options.topLimit),
    };
  },
};

function _sqliteWeekNumber(date) {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  
  const jan1MondayOffset = (jan1.getDay() + 6) % 7;
  
  const firstMondayDoy = (7 - jan1MondayOffset) % 7;
  
  const dayOfYear = Math.floor((date - jan1) / 86400000);

  if (dayOfYear < firstMondayDoy) return 0;   
  return Math.floor((dayOfYear - firstMondayDoy) / 7) + 1;
}

module.exports = DashboardService;
