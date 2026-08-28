const prisma = require('../utils/prisma');
const { sendSuccess, sendError } = require('../utils/response');

const getAllEvents = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const whereClause = {};

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { organizer: { contains: search } },
      ];
    }

    const events = await prisma.campusEvent.findMany({
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
      orderBy: { startDate: 'asc' },
    });

    return sendSuccess(res, events, 'Campus events retrieved.');
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { title, description, category = 'Workshop', startDate, endDate, buildingId, room, organizer, bannerImage } = req.body;

    if (!title || !startDate || !endDate) {
      return sendError(res, 'Title, start date, and end date are required.', 400);
    }

    const event = await prisma.campusEvent.create({
      data: {
        title: title.trim(),
        description: description || '',
        category,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        buildingId: buildingId || null,
        room: room || null,
        organizer: organizer || 'CampusLens Organization',
        bannerImage: bannerImage || null,
      },
      include: {
        building: true,
      },
    });

    return sendSuccess(res, event, 'Event created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, startDate, endDate, buildingId, room, organizer, bannerImage } = req.body;

    const updated = await prisma.campusEvent.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(buildingId !== undefined && { buildingId: buildingId || null }),
        ...(room !== undefined && { room }),
        ...(organizer && { organizer }),
        ...(bannerImage !== undefined && { bannerImage }),
      },
      include: {
        building: true,
      },
    });

    return sendSuccess(res, updated, 'Event updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.campusEvent.delete({
      where: { id },
    });

    return sendSuccess(res, null, 'Event deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
