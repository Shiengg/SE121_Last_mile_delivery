const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getProfile, updateProfile, getDeliveryStaff } = require('../controllers/userController');

// Protected routes
router.use(protect);

// Get user profile
router.get('/profile', getProfile);

// Update user profile
router.put('/profile', updateProfile);

// Get delivery staff list - accessible by Admin only
router.get('/delivery-staff', authorize('Admin'), getDeliveryStaff);

module.exports = router; 