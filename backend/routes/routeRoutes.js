const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const Route = require('../models/Route');
const { 
    createRoute, 
    getAllRoutes, 
    updateRouteStatus, 
    deleteRoute, 
    updateRoute, 
    assignRoute,
    claimRoute,
    getRouteById
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
router.post('/assign', protect, authorize('Admin'), async (req, res) => {
    try {
        const { route_id, delivery_staff_id } = req.body;
        
        // Validate input
        if (!route_id || !delivery_staff_id) {
            return res.status(400).json({
                success: false,
                message: 'Route ID and Delivery Staff ID are required'
            });
        }

        // Update route
        const route = await Route.findByIdAndUpdate(
            route_id,
            {
                delivery_staff_id,
                status: 'assigned',
                assigned_at: new Date()
            },
            { 
                new: true,
                runValidators: true
            }
        ).populate('delivery_staff_id');

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.json({
            success: true,
            message: 'Route assigned successfully',
            data: route
        });
    } catch (error) {
        console.error('Error assigning route:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning route',
            error: error.message
        });
    }
});

// Thêm route mới
router.get('/:id', protect, getRouteById);

module.exports = router;
