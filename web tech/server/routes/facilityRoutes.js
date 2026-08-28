const express = require('express');
const router = express.Router();
const {
  getAllFacilities,
  getFacilityById,
  getEmergencyFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
} = require('../controllers/facilityController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/emergency', getEmergencyFacilities);
router.get('/', getAllFacilities);
router.get('/:id', getFacilityById);
router.post('/', protect, adminOnly, createFacility);
router.put('/:id', protect, adminOnly, updateFacility);
router.delete('/:id', protect, adminOnly, deleteFacility);

module.exports = router;
