const prisma = require('../utils/prisma');
const { sendError } = require('../utils/response');
const { verifyToken } = require('../utils/jwt');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'User associated with this token no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 'Invalid or expired token. Please log in again.', 401);
    }
    return sendError(res, 'Authentication verification failed.', 500);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, `Access forbidden. Required role: ${roles.join(', ')}`, 403);
    }
    next();
  };
};

const adminOnly = authorize('ADMIN');

module.exports = {
  protect,
  authorize,
  adminOnly,
};
