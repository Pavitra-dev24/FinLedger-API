const TransactionService = require('../services/transaction.service');
const { asyncHandler } = require('../utils/errors');

const createTransaction = asyncHandler(async (req, res) => {
  const { amount, type, category, date, notes } = req.body;
  const tx = TransactionService.createTransaction(
    { amount: parseFloat(amount), type, category, date, notes },
    req.user.id
  );
  res.status(201).json({ success: true, data: tx });
});

const listTransactions = asyncHandler(async (req, res) => {
  const {
    page, limit, type, category,
    dateFrom, dateTo, search,
    sortBy, sortOrder,
  } = req.query;

  const result = TransactionService.listTransactions({
    page:      parseInt(page, 10)  || 1,
    limit:     parseInt(limit, 10) || 20,
    type,
    category,
    dateFrom,
    dateTo,
    search,
    sortBy,
    sortOrder,
  });

  res.status(200).json({ success: true, data: result });
});

const getTransactionById = asyncHandler(async (req, res) => {
  const tx = TransactionService.getTransactionById(req.params.id);
  res.status(200).json({ success: true, data: tx });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const { amount, type, category, date, notes } = req.body;
  const fields = {};
  if (amount    !== undefined) fields.amount   = parseFloat(amount);
  if (type      !== undefined) fields.type     = type;
  if (category  !== undefined) fields.category = category;
  if (date      !== undefined) fields.date     = date;
  if (notes     !== undefined) fields.notes    = notes;

  const tx = TransactionService.updateTransaction(req.params.id, fields);
  res.status(200).json({ success: true, data: tx });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  TransactionService.deleteTransaction(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Transaction deleted successfully.',
  });
});

module.exports = {
  createTransaction,
  listTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
