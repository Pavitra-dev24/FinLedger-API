const { body, query } = require('express-validator');

const VALID_CATEGORIES = [
  'salary', 'freelance', 'investment', 'rental', 'other_income',
  'food', 'housing', 'transport', 'utilities', 'healthcare',
  'entertainment', 'education', 'shopping', 'travel', 'other_expense',
];

const createRules = [
  body('amount')
    .notEmpty().withMessage('Amount is required.')
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),

  body('type')
    .notEmpty().withMessage('Type is required.')
    .isIn(['income', 'expense']).withMessage("Type must be 'income' or 'expense'."),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required.')
    .isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`),

  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD).'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be at most 500 characters.'),
];

const updateRules = [
  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),

  body('type')
    .optional()
    .isIn(['income', 'expense']).withMessage("Type must be 'income' or 'expense'."),

  body('category')
    .optional()
    .trim()
    .isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD).'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be at most 500 characters.'),
];

const listQueryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('type').optional().isIn(['income', 'expense']).withMessage("Type must be 'income' or 'expense'."),
  query('category').optional().isIn(VALID_CATEGORIES).withMessage('Invalid category.'),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO 8601 date.'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO 8601 date.'),
  query('sortBy').optional().isIn(['date', 'amount', 'created_at', 'type', 'category']).withMessage('Invalid sort field.'),
  query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage("sortOrder must be 'ASC' or 'DESC'."),
];

module.exports = { createRules, updateRules, listQueryRules, VALID_CATEGORIES };
