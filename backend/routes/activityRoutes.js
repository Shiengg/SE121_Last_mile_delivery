const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getRecentActivities, clearAllActivities, clearNotifications } = require('../controllers/activityController');

router.get('/recent', protect, authorize('Admin'), getRecentActivities);
router.delete('/clear-all', protect, authorize('Admin'), clearAllActivities);
router.delete('/clear-notifications', protect, authorize('Admin'), clearNotifications);

module.exports = router; 