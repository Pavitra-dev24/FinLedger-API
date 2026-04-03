const express = require('express');
const router  = express.Router();

const {
  listUsers,
  getUserById,
  updateUser,
  setUserStatus,
} = require('../controllers/user.controller');

const { authenticate }    = require('../middleware/auth');
const { requireAdmin }    = require('../middleware/rbac');
const { validate }        = require('../middleware/validate');
const { body, query }     = require('express-validator');

router.use(authenticate);

router.get(
  '/',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['viewer', 'analyst', 'admin']),
    query('status').optional().isIn(['active', 'inactive']),
  ],
  validate,
  listUsers
);

router.get('/:id', requireAdmin, getUserById);

router.patch(
  '/:id',
  requireAdmin,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('email').optional().trim().isEmail().normalizeEmail(),
    body('role').optional().isIn(['viewer', 'analyst', 'admin']),
    body('password').optional().isLength({ min: 8 })
      .matches(/[A-Z]/).withMessage('Password needs an uppercase letter.')
      .matches(/[0-9]/).withMessage('Password needs a number.'),
  ],
  validate,
  updateUser
);

router.patch(
  '/:id/status',
  requireAdmin,
  [
    body('status')
      .notEmpty().withMessage('Status is required.')
      .isIn(['active', 'inactive']).withMessage("Status must be 'active' or 'inactive'."),
  ],
  validate,
  setUserStatus
);

module.exports = router;
