const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  createRouteNode,
  createRouteEdge,
  deleteRouteNode,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.post('/nodes', createRouteNode);
router.post('/edges', createRouteEdge);
router.delete('/nodes/:id', deleteRouteNode);

module.exports = router;
