const prisma = require('../utils/prisma');
const { sendSuccess, sendError } = require('../utils/response');
const { getAdminStats } = require('../services/analyticsService');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await getAdminStats();
    return sendSuccess(res, stats, 'Admin dashboard statistics retrieved.');
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;

    const whereClause = {};
    if (role && role !== 'All') {
      whereClause.role = role;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            favorites: true,
            history: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, users, 'Users retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, department } = req.body;

    if (role && !['STUDENT', 'STAFF', 'ADMIN'].includes(role)) {
      return sendError(res, 'Invalid role. Must be STUDENT, STAFF, or ADMIN.', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(department && { department }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    return sendSuccess(res, user, 'User role updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return sendError(res, 'You cannot delete your own admin account.', 400);
    }

    await prisma.user.delete({
      where: { id },
    });

    return sendSuccess(res, null, 'User deleted successfully.');
  } catch (error) {
    next(error);
  }
};

const createRouteNode = async (req, res, next) => {
  try {
    const { nodeId, name, lat, lng, floor = 1, buildingId, isIndoor = false, isAccessible = true } = req.body;

    if (!nodeId || !name || lat === undefined || lng === undefined) {
      return sendError(res, 'nodeId, name, lat, and lng are required.', 400);
    }

    const node = await prisma.routeNode.create({
      data: {
        nodeId: nodeId.trim(),
        name: name.trim(),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        floor: parseInt(floor, 10) || 1,
        buildingId: buildingId || null,
        isIndoor: Boolean(isIndoor),
        isAccessible: Boolean(isAccessible),
      },
    });

    return sendSuccess(res, node, 'Route node created.', 201);
  } catch (error) {
    next(error);
  }
};

const createRouteEdge = async (req, res, next) => {
  try {
    const { fromNodeId, toNodeId, distance, isAccessible = true, isStairs = false, isElevator = false, isOutdoor = true, description } = req.body;

    if (!fromNodeId || !toNodeId || distance === undefined) {
      return sendError(res, 'fromNodeId, toNodeId, and distance are required.', 400);
    }

    const edge = await prisma.routeEdge.create({
      data: {
        fromNodeId,
        toNodeId,
        distance: parseFloat(distance),
        isAccessible: Boolean(isAccessible),
        isStairs: Boolean(isStairs),
        isElevator: Boolean(isElevator),
        isOutdoor: Boolean(isOutdoor),
        description: description || null,
      },
    });

    return sendSuccess(res, edge, 'Route edge created.', 201);
  } catch (error) {
    next(error);
  }
};

const deleteRouteNode = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.routeNode.delete({ where: { id } });
    return sendSuccess(res, null, 'Node deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  createRouteNode,
  createRouteEdge,
  deleteRouteNode,
};
