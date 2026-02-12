/**
 * Central Error Handler Middleware
 * Provides consistent error handling across the application
 */

const { sendError } = require('./responseEnvelope');

/**
 * Application Error class for custom errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper to catch async errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not Found handler
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  let { statusCode = 500, message } = err;
  
  // Log error details
  console.error('Error:', {
    message: err.message,
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference';
  }
  
  // Send error response
  const details = process.env.NODE_ENV === 'development' ? err.stack : null;
  sendError(res, message, statusCode, details);
}

/**
 * Validation error helper
 */
function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (error) {
      const details = error.details.map(detail => ({
        message: detail.message,
        path: detail.path
      }));
      
      return next(new AppError('Validation failed', 400, details));
    }
    
    next();
  };
}

module.exports = {
  AppError,
  asyncHandler,
  notFoundHandler,
  errorHandler,
  validateRequest
};
