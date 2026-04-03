const DashboardService = require('../services/dashboard.service');
const { asyncHandler } = require('../utils/errors');

const getFullDashboard = asyncHandler(async (req, res) => {
  const data = DashboardService.getFullDashboard({
    recentLimit: req.query.recentLimit,
    topLimit:    req.query.topLimit,
  });
  res.status(200).json({ success: true, data });
});

const getSummary = asyncHandler(async (req, res) => {
  const data = DashboardService.getSummary();
  res.status(200).json({ success: true, data });
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const data = DashboardService.getCategoryBreakdown();
  res.status(200).json({ success: true, data });
});

const getMonthlyTrend = asyncHandler(async (req, res) => {
  const data = DashboardService.getMonthlyTrend();
  res.status(200).json({ success: true, data });
});

const getWeeklyTrend = asyncHandler(async (req, res) => {
  const data = DashboardService.getWeeklyTrend();
  res.status(200).json({ success: true, data });
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const data = DashboardService.getRecentActivity(req.query.limit);
  res.status(200).json({ success: true, data });
});

const getTopSpendingCategories = asyncHandler(async (req, res) => {
  const data = DashboardService.getTopSpendingCategories(req.query.limit);
  res.status(200).json({ success: true, data });
});

module.exports = {
  getFullDashboard,
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrend,
  getWeeklyTrend,
  getRecentActivity,
  getTopSpendingCategories,
};
