const express = require('express');
const router  = express.Router();

const {
  createTransaction,
  listTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transaction.controller');

const { authenticate }    = require('../middleware/auth');
const { requireAdmin, requireAnalyst } = require('../middleware/rbac');
const { validate }        = require('../middleware/validate');
const {
  createRules,
  updateRules,
  listQueryRules,
} = require('../validators/transaction.validator');

router.use(authenticate);

router.get('/', requireAnalyst, listQueryRules, validate, listTransactions);

router.get('/:id', requireAnalyst, getTransactionById);

router.post('/', requireAdmin, createRules, validate, createTransaction);

router.patch('/:id', requireAdmin, updateRules, validate, updateTransaction);

router.delete('/:id', requireAdmin, deleteTransaction);

module.exports = router;
