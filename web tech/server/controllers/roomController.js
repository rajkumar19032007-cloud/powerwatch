const prisma = require('../utils/prisma');
const { sendSuccess, sendError } = require('../utils/response');

const getAllRooms = async (req, res, next) => {
  try {
    const { buildingId, department, type, search } = req.query;

    const whereClause = {};

    if (buildingId) whereClause.buildingId = buildingId;
    if (department && department !== 'All') whereClause.department = department;
    if (type && type !== 'All') whereClause.type = type;

    if (search) {
      whereClause.OR = [
        { roomNumber: { contains: search } },
        { name: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const rooms = await prisma.room.findMany({
      where: whereClause,
      include: {
        building: {
          select: {
            id: true,
            name: true,
            code: true,
            lat: true,
            lng: true,
            color: true,
          },
        },
      },
      orderBy: [{ buildingId: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }],
    });

    return sendSuccess(res, rooms, 'Rooms retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        building: true,
      },
    });

    if (!room) {
      return sendError(res, 'Room not found.', 404);
    }

    return sendSuccess(res, room, 'Room details retrieved.');
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, name, buildingId, floor = 1, department, type = 'CLASSROOM', capacity = 60, coordinates } = req.body;

    if (!roomNumber || !name || !buildingId) {
      return sendError(res, 'Room number, name, and building are required.', 400);
    }

    const newRoom = await prisma.room.create({
      data: {
        roomNumber: roomNumber.trim(),
        name: name.trim(),
        buildingId,
        floor: parseInt(floor, 10) || 1,
        department: department || 'General',
        type: type || 'CLASSROOM',
        capacity: parseInt(capacity, 10) || 60,
        coordinates: typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates || {}),
      },
      include: {
        building: true,
      },
    });

    return sendSuccess(res, newRoom, 'Room created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roomNumber, name, buildingId, floor, department, type, capacity, coordinates } = req.body;

    const updated = await prisma.room.update({
      where: { id },
      data: {
        ...(roomNumber && { roomNumber: roomNumber.trim() }),
        ...(name && { name: name.trim() }),
        ...(buildingId && { buildingId }),
        ...(floor !== undefined && { floor: parseInt(floor, 10) }),
        ...(department && { department }),
        ...(type && { type }),
        ...(capacity !== undefined && { capacity: parseInt(capacity, 10) }),
        ...(coordinates !== undefined && {
          coordinates: typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates),
        }),
      },
      include: {
        building: true,
      },
    });

    return sendSuccess(res, updated, 'Room updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.room.delete({
      where: { id },
    });

    return sendSuccess(res, null, 'Room deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
