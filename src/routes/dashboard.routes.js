const express = require('express');
const router  = express.Router();

const {
  getFullDashboard,
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrend,
  getWeeklyTrend,
  getRecentActivity,
  getTopSpendingCategories,
} = require('../controllers/dashboard.controller');

const { authenticate }    = require('../middleware/auth');
const { requireViewer }   = require('../middleware/rbac');

router.use(authenticate);
router.use(requireViewer);

router.get('/', getFullDashboard);

router.get('/summary', getSummary);

router.get('/categories', getCategoryBreakdown);

router.get('/trends/monthly', getMonthlyTrend);

router.get('/trends/weekly', getWeeklyTrend);

router.get('/recent', getRecentActivity);

router.get('/top-spending', getTopSpendingCategories);

module.exports = router;
