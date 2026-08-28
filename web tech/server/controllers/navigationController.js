const prisma = require('../utils/prisma');
const { sendSuccess, sendError } = require('../utils/response');
const { findRoute } = require('../services/pathfindingService');

const calculateRoute = async (req, res, next) => {
  try {
    const { originLat, originLng, destLat, destLng, preferences = {} } = req.body;

    if (originLat === undefined || originLng === undefined || destLat === undefined || destLng === undefined) {
      return sendError(res, 'Origin coordinates (originLat, originLng) and destination coordinates (destLat, destLng) are required.', 400);
    }

    const routeResult = await findRoute({
      originLat: parseFloat(originLat),
      originLng: parseFloat(originLng),
      destLat: parseFloat(destLat),
      destLng: parseFloat(destLng),
      preferences,
    });

    return sendSuccess(res, routeResult, 'Route calculated successfully.');
  } catch (error) {
    next(error);
  }
};

const recordHistory = async (req, res, next) => {
  try {
    const {
      originName,
      originLat,
      originLng,
      destName,
      destLat,
      destLng,
      distanceMeters,
      durationSeconds,
      mode = '2D',
    } = req.body;

    if (!req.user) {
      return sendSuccess(res, null, 'History noted.');
    }

    const historyItem = await prisma.navigationHistory.create({
      data: {
        userId: req.user.id,
        originName: originName || 'Current Location',
        originLat: parseFloat(originLat) || 0,
        originLng: parseFloat(originLng) || 0,
        destName: destName || 'Destination',
        destLat: parseFloat(destLat) || 0,
        destLng: parseFloat(destLng) || 0,
        distanceMeters: parseFloat(distanceMeters) || 0,
        durationSeconds: parseInt(durationSeconds, 10) || 0,
        mode: mode || '2D',
      },
    });

    return sendSuccess(res, historyItem, 'Navigation session recorded.', 201);
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await prisma.navigationHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return sendSuccess(res, history, 'Navigation history retrieved.');
  } catch (error) {
    next(error);
  }
};

const getRouteGraph = async (req, res, next) => {
  try {
    const [nodes, edges] = await Promise.all([
      prisma.routeNode.findMany(),
      prisma.routeEdge.findMany(),
    ]);

    return sendSuccess(res, { nodes, edges }, 'Campus route network retrieved.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateRoute,
  recordHistory,
  getHistory,
  getRouteGraph,
};
