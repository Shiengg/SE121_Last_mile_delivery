const express = require('express');
const router = express.Router();
const { getAllDistricts } = require('../controllers/districtController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Debug logging middleware
router.use((req, res, next) => {
    console.log('District route accessed:', {
        method: req.method,
        path: req.path,
        query: req.query,
        user: req.user?._id,
        headers: req.headers
    });
    next();
});

// Test route to verify the router is working
router.get('/test', (req, res) => {
    res.json({ message: 'District route is working' });
});

// Get all districts - accessible by Admin only
router.get('/', protect, authorize('Admin'), getAllDistricts);

module.exports = router; 