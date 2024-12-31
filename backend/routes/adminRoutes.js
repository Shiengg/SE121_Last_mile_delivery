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

// Log all registered routes
console.log('Registered admin routes:', 
    router.stack
        .filter(r => r.route)
        .map(r => ({
            path: r.route.path,
            methods: Object.keys(r.route.methods)
        }))
);

module.exports = router;
