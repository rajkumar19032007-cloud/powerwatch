const prisma = require('../utils/prisma');
const { sendSuccess, sendError } = require('../utils/response');

const getAllFacilities = async (req, res, next) => {
  try {
    const { category, search, buildingId } = req.query;

    const whereClause = {};

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (buildingId) {
      whereClause.buildingId = buildingId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const facilities = await prisma.facility.findMany({
      where: whereClause,
      include: {
        building: {
          select: {
            id: true,
            name: true,
            code: true,
            lat: true,
            lng: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, facilities, 'Facilities retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

const getFacilityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        building: true,
      },
    });

    if (!facility) {
      return sendError(res, 'Facility not found.', 404);
    }

    return sendSuccess(res, facility, 'Facility details retrieved.');
  } catch (error) {
    next(error);
  }
};

const getEmergencyFacilities = async (req, res, next) => {
  try {
    const emergencyList = await prisma.facility.findMany({
      where: {
        category: 'Emergency',
      },
      include: {
        building: true,
      },
    });

    return sendSuccess(res, emergencyList, 'Emergency contacts & facilities retrieved.');
  } catch (error) {
    next(error);
  }
};

const createFacility = async (req, res, next) => {
  try {
    const {
      name,
      category = 'Academic',
      description,
      buildingId,
      lat,
      lng,
      floor = 1,
      openingHours = '08:00 AM - 08:00 PM',
      contactPhone = '',
      isWheelchairAccessible = true,
      image,
    } = req.body;

    if (!name || lat === undefined || lng === undefined) {
      return sendError(res, 'Name, latitude, and longitude are required.', 400);
    }

    const newFacility = await prisma.facility.create({
      data: {
        name: name.trim(),
        category,
        description: description || '',
        buildingId: buildingId || null,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        floor: parseInt(floor, 10) || 1,
        openingHours: openingHours || '08:00 AM - 08:00 PM',
        contactPhone: contactPhone || '',
        isWheelchairAccessible: Boolean(isWheelchairAccessible),
        image: image || null,
      },
      include: {
        building: true,
      },
    });

    return sendSuccess(res, newFacility, 'Facility created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

const updateFacility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      description,
      buildingId,
      lat,
      lng,
      floor,
      openingHours,
      contactPhone,
      isWheelchairAccessible,
      image,
    } = req.body;

    const updated = await prisma.facility.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(buildingId !== undefined && { buildingId: buildingId || null }),
        ...(lat !== undefined && { lat: parseFloat(lat) }),
        ...(lng !== undefined && { lng: parseFloat(lng) }),
        ...(floor !== undefined && { floor: parseInt(floor, 10) }),
        ...(openingHours !== undefined && { openingHours }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(isWheelchairAccessible !== undefined && {
          isWheelchairAccessible: Boolean(isWheelchairAccessible),
        }),
        ...(image !== undefined && { image }),
      },
      include: {
        building: true,
      },
    });

    return sendSuccess(res, updated, 'Facility updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteFacility = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.facility.delete({
      where: { id },
    });

    return sendSuccess(res, null, 'Facility deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFacilities,
  getFacilityById,
  getEmergencyFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
};
