const express = require('express');
const router = express.Router();
const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

router.use(protect); // All favorite operations require authentication

router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:id', removeFavorite);

module.exports = router;
