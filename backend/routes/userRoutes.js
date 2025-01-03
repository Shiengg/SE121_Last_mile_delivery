const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getProfile, updateProfile, getDeliveryStaff } = require('../controllers/userController');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/delivery-staff', protect, authorize('Admin'), getDeliveryStaff);

module.exports = router; 