const TransactionModel = require('../models/transaction.model');
const { AppError } = require('../utils/errors');

const TransactionService = {
  createTransaction(data, userId) {
    return TransactionModel.create({ ...data, createdBy: userId });
  },

  listTransactions(filters) {
    return TransactionModel.findAll(filters);
  },

  getTransactionById(id) {
    const tx = TransactionModel.findById(id);
    if (!tx) throw new AppError('Transaction not found.', 404);
    return tx;
  },

  updateTransaction(id, fields) {
    if (!TransactionModel.exists(id)) {
      throw new AppError('Transaction not found.', 404);
    }
    return TransactionModel.patch(id, fields);
  },

  deleteTransaction(id) {
    if (!TransactionModel.exists(id)) {
      throw new AppError('Transaction not found.', 404);
    }
    TransactionModel.softDelete(id);
  },
};

module.exports = TransactionService;
