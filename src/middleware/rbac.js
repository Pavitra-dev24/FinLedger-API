const { AppError } = require('../utils/errors');

const ROLE_HIERARCHY = {
  viewer: 0,
  analyst: 1,
  admin: 2,
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be authenticated.', 401));
    }

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const hasAccess = allowedRoles.some(
      (role) => userLevel >= ROLE_HIERARCHY[role]
    );

    if (!hasAccess) {
      return next(
        new AppError(
          `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
          403
        )
      );
    }

    next();
  };
};

const requireAdmin   = authorize('admin');
const requireAnalyst = authorize('analyst');
const requireViewer  = authorize('viewer'); 

module.exports = { authorize, requireAdmin, requireAnalyst, requireViewer };
