const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('[CampusLens Server Error]', err);

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    const field = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return sendError(res, `A record with this ${field} already exists.`, 409);
  }

  // Prisma record not found error
  if (err.code === 'P2025') {
    return sendError(res, 'Requested resource was not found.', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
};

module.exports = errorHandler;
