/**
 * CampusOS Backend — Error Handling Middleware (middleware/errorHandler.js)
 * Clean, safe JSON error handling for unknown routes and internal errors.
 */

const config = require('../config/config');

/**
 * 404 Not Found Middleware for unmapped API routes
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global 500 Server Error Handler
 */
const globalErrorHandler = (err, req, res, next) => {
  // Log internal error for debugging
  console.error('[CampusOS Error]:', err);

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  // Attach stack trace only in development environment
  if (config.nodeEnv === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
