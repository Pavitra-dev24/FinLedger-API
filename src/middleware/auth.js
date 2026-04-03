const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { AppError } = require('../utils/errors');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is missing.', 401));
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token.', 401));
  }

  
  
  const user = db
    .prepare('SELECT id, name, email, role, status FROM users WHERE id = ?')
    .get(decoded.id);

  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (user.status === 'inactive') {
    return next(new AppError('Your account has been deactivated. Contact an administrator.', 403));
  }

  req.user = user;
  next();
};

module.exports = { authenticate };
