const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { 
    createRoute, 
    getAllRoutes, 
    updateRouteStatus, 
    deleteRoute, 
    updateRoute, 
    assignRoute,
    claimRoute
} = require('../controllers/routeController');

// Protect all routes
router.use(protect);

// Public routes (accessible by both Admin and DeliveryStaff)
router.get('/', getAllRoutes);

// DeliveryStaff routes
router.put('/:id/status', protect, async (req, res, next) => {
    if (req.user.role === 'DeliveryStaff' || req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Not authorized'
        });
    }
}, updateRouteStatus);

router.post('/claim', protect, authorize('DeliveryStaff'), claimRoute);

// Admin only routes
router.post('/', protect, authorize('Admin'), createRoute);
router.delete('/:id', protect, authorize('Admin'), deleteRoute);
router.put('/:id', protect, authorize('Admin'), updateRoute);
router.post('/assign', protect, authorize('Admin'), assignRoute);

module.exports = router;
