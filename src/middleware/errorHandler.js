const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => { 
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error.';

  
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    statusCode = 409;
    message = 'A record with that value already exists.';
  }

  
  if (!err.isOperational && process.env.NODE_ENV !== 'test') {
    console.error('[Unhandled Error]', err);
  }

  const response = {
    success: false,
    message,
  };

  
  if (err.errors) {
    response.errors = err.errors;
  }

  
  
  
  
  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
