const prisma = require('../utils/prisma');
const { sendSuccess, sendError } = require('../utils/response');

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, favorites, 'User favorites retrieved.');
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { targetType, targetId, title, subtitle, icon = 'map-pin' } = req.body;

    if (!targetType || !targetId || !title) {
      return sendError(res, 'targetType, targetId, and title are required.', 400);
    }

    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: {
        userId: req.user.id,
        targetType,
        targetId,
      },
    });

    if (existing) {
      return sendSuccess(res, existing, 'Already saved to favorites.');
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user.id,
        targetType,
        targetId,
        title: title.trim(),
        subtitle: subtitle || null,
        icon: icon || 'map-pin',
      },
    });

    return sendSuccess(res, favorite, 'Added to favorites.', 201);
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;

    const favorite = await prisma.favorite.findUnique({
      where: { id },
    });

    if (!favorite) {
      return sendError(res, 'Favorite not found.', 404);
    }

    if (favorite.userId !== req.user.id) {
      return sendError(res, 'Unauthorized to delete this favorite.', 403);
    }

    await prisma.favorite.delete({
      where: { id },
    });

    return sendSuccess(res, null, 'Favorite removed.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};
