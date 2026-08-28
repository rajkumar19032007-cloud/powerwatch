const prisma = require('../utils/prisma');
const { sendSuccess, sendError } = require('../utils/response');

const getAllBuildings = async (req, res, next) => {
  try {
    const { search, category } = req.query;

    const whereClause = {};

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const buildings = await prisma.building.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            rooms: true,
            facilities: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, buildings, 'Buildings retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

const getBuildingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        rooms: {
          orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
        },
        facilities: true,
        events: {
          where: {
            startDate: { gte: new Date() },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!building) {
      return sendError(res, 'Building not found.', 404);
    }

    return sendSuccess(res, building, 'Building details retrieved.');
  } catch (error) {
    next(error);
  }
};

const createBuilding = async (req, res, next) => {
  try {
    const {
      name,
      code,
      description,
      category = 'Academic',
      lat,
      lng,
      altitude = 0.0,
      floors = 3,
      image,
      color = '#00F0FF',
      width = 20.0,
      depth = 20.0,
      height = 15.0,
      amenities = '[]',
    } = req.body;

    if (!name || !code || lat === undefined || lng === undefined) {
      return sendError(res, 'Name, code, latitude, and longitude are required.', 400);
    }

    const newBuilding = await prisma.building.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description || '',
        category,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        altitude: parseFloat(altitude) || 0.0,
        floors: parseInt(floors, 10) || 3,
        image: image || null,
        color: color || '#00F0FF',
        width: parseFloat(width) || 20.0,
        depth: parseFloat(depth) || 20.0,
        height: parseFloat(height) || 15.0,
        amenities: typeof amenities === 'string' ? amenities : JSON.stringify(amenities),
      },
    });

    return sendSuccess(res, newBuilding, 'Building created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

const updateBuilding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      description,
      category,
      lat,
      lng,
      altitude,
      floors,
      image,
      color,
      width,
      depth,
      height,
      amenities,
    } = req.body;

    const updated = await prisma.building.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(lat !== undefined && { lat: parseFloat(lat) }),
        ...(lng !== undefined && { lng: parseFloat(lng) }),
        ...(altitude !== undefined && { altitude: parseFloat(altitude) }),
        ...(floors !== undefined && { floors: parseInt(floors, 10) }),
        ...(image !== undefined && { image }),
        ...(color && { color }),
        ...(width !== undefined && { width: parseFloat(width) }),
        ...(depth !== undefined && { depth: parseFloat(depth) }),
        ...(height !== undefined && { height: parseFloat(height) }),
        ...(amenities !== undefined && {
          amenities: typeof amenities === 'string' ? amenities : JSON.stringify(amenities),
        }),
      },
    });

    return sendSuccess(res, updated, 'Building updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteBuilding = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.building.delete({
      where: { id },
    });

    return sendSuccess(res, null, 'Building deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
};
