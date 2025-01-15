const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

// Debug log
console.log('Setting up admin routes...');

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Admin route is working' });
});

// Dashboard stats
router.get('/dashboard-stats', protect, authorize('Admin'), adminController.getDashboardStats);

// Delivery staff
router.get('/delivery-staff', protect, authorize('Admin'), adminController.getDeliveryStaff);

// Add new route for updating delivery staff status
router.put('/delivery-staff/status', protect, authorize('Admin'), adminController.updateDeliveryStaffStatus);

module.exports = router;
