/**
 * CampusOS Backend — Role Middleware (middleware/roleMiddleware.js)
 * Phase 10: Authentication & Role-Based Access
 * Enforces role-based access control (RBAC) on protected API routes.
 */

/**
 * Middleware factory to enforce required roles
 * @param  {...string} allowedRoles - e.g. 'student', 'faculty', 'admin'
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role not identified.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
