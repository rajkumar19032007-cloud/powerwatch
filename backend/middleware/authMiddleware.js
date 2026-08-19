/**
 * CampusOS Backend — Authentication Middleware (middleware/authMiddleware.js)
 * Phase 10: Authentication & Role-Based Access
 * Validates incoming JSON Web Tokens (Bearer format) and attaches req.user.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware to verify JWT token in Authorization header
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or malformed authorization token.',
      });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token. Please log in again.',
        });
      }

      // Attach authenticated user information to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('[CampusOS Auth Middleware Error]:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = {
  verifyToken,
};
