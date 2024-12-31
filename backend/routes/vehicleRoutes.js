const express = require('express');
const router = express.Router();
const { getAllVehicleTypes, createVehicleType, updateVehicleType, deleteVehicleType } = require('../controllers/vehicleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Đảm bảo các middleware protect và authorize đã được định nghĩa
router.route('/')
    .get(protect, authorize('Admin'), getAllVehicleTypes)
    .post(protect, authorize('Admin'), createVehicleType);

router.route('/:id')
    .put(protect, authorize('Admin'), updateVehicleType)
    .delete(protect, authorize('Admin'), deleteVehicleType);

module.exports = router;
