// FILE: backend/middleware/errorHandler.js
let logger = console;
try {
  logger = require('../utils/logger');
} catch (e) {
  // fallback to console
}

function errorHandler(err, req, res, next) {
  const isOperational = err.isOperational || false;
  const statusCode = err.statusCode || 500;
  
  // Format standardized API error response
  const responsePayload = {
    success: false,
    message: isOperational ? err.message : 'Terjadi kesalahan sistem internal.',
    data: null,
    errors: err.errors || [
      {
        message: err.message || 'Error internal.',
        field: err.field || null
      }
    ],
    meta: {
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    }
  };

  // Stack trace sanitization (only expose in non-production environments)
  if (process.env.NODE_ENV !== 'production' && !isOperational) {
    responsePayload.meta.stack = err.stack;
  }

  // Log error using structured logging service
  if (statusCode >= 500) {
    if (typeof logger.error === 'function') {
      logger.error(`[500 Error] Path: ${req.originalUrl} | Error: ${err.message}`, { stack: err.stack });
    } else {
      console.error(`[500 Error] Path: ${req.originalUrl}`, err);
    }
  } else {
    if (typeof logger.warn === 'function') {
      logger.warn(`[Client Error ${statusCode}] Path: ${req.originalUrl} | Msg: ${err.message}`);
    } else {
      console.warn(`[Client Error ${statusCode}] Path: ${req.originalUrl} | Msg: ${err.message}`);
    }
  }

  res.status(statusCode).json(responsePayload);
}

// Operational Error utility class
class AppError extends Error {
  constructor(message, statusCode = 400, errors = null, field = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    this.field = field;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  AppError
};
