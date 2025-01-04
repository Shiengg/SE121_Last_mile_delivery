const express = require('express');
const router = express.Router();
const { getRecentActivities, clearNotifications } = require('../controllers/activityController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Middleware để log requests
router.use((req, res, next) => {
    console.log(`Activity route accessed: ${req.method} ${req.path}`);
    next();
});

// Get recent activities - accessible by Admin and DeliveryStaff
router.get('/recent', protect, authorize('Admin', 'DeliveryStaff'), getRecentActivities);

// Clear notifications - accessible by Admin and DeliveryStaff 
router.delete('/clear-notifications', protect, authorize('Admin', 'DeliveryStaff'), clearNotifications);

module.exports = router; 