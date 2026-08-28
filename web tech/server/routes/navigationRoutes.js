const express = require('express');
const router = express.Router();
const {
  calculateRoute,
  recordHistory,
  getHistory,
  getRouteGraph,
} = require('../controllers/navigationController');
const { protect } = require('../middleware/auth');

router.post('/route', calculateRoute);
router.get('/graph', getRouteGraph);
router.post('/history', (req, res, next) => {
  // Optional auth: if token provided, authenticate, otherwise continue
  const token = req.headers.authorization?.split(' ')[1];
  if (token) return protect(req, res, next);
  next();
}, recordHistory);
router.get('/history', protect, getHistory);

module.exports = router;
