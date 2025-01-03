const express = require('express');
const router = express.Router();
const { getRecentActivities } = require('../controllers/activityController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Middleware để log requests
router.use((req, res, next) => {
    console.log(`Activity route accessed: ${req.method} ${req.path}`);
    next();
});

// Get recent activities - accessible by Admin only
router.get('/recent', protect, authorize('Admin'), getRecentActivities);

module.exports = router; 