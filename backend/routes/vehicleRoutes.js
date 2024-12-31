const express = require('express');
const router = express.Router();
const { getAllVehicleTypes, createVehicleType } = require('../controllers/vehicleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Đảm bảo các middleware protect và authorize đã được định nghĩa
router.route('/')
    .get(protect, authorize('Admin'), getAllVehicleTypes)
    .post(protect, authorize('Admin'), createVehicleType);

module.exports = router;
