const express = require('express');
const router = express.Router();
const {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} = require('../controllers/buildingController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getAllBuildings);
router.get('/:id', getBuildingById);
router.post('/', protect, adminOnly, createBuilding);
router.put('/:id', protect, adminOnly, updateBuilding);
router.delete('/:id', protect, adminOnly, deleteBuilding);

module.exports = router;
