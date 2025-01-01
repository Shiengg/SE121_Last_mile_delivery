const express = require('express');
const router = express.Router();
const { getAllWards } = require('../controllers/wardController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Debug logging middleware
router.use((req, res, next) => {
    console.log('Ward route accessed:', {
        method: req.method,
        path: req.path,
        query: req.query,
        user: req.user?._id,
        headers: req.headers
    });
    next();
});

// Get all wards - accessible by Admin only
router.get('/', protect, authorize('Admin'), getAllWards);

module.exports = router; 