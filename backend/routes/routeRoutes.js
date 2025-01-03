const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { 
    createRoute, 
    getAllRoutes, 
    updateRouteStatus, 
    deleteRoute, 
    updateRoute, 
    assignRoute 
} = require('../controllers/routeController');

// Protect all routes
router.use(protect);

// Public routes
router.get('/', getAllRoutes);

// Admin only routes
router.use(authorize('Admin'));

router.post('/', createRoute);
router.put('/:id/status', updateRouteStatus);
router.delete('/:id', deleteRoute);
router.put('/:id', updateRoute);

// Move assignRoute outside of Admin authorization
router.post('/assign', assignRoute);

module.exports = router;
