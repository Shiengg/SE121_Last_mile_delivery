const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { getDashboardStats } = require('../controllers/adminController');

// Debug log
console.log('Setting up admin routes...');

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Admin routes working' });
});

// Dashboard stats route
router.get('/dashboard-stats', authenticate, authorize(['Admin']), getDashboardStats);

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
