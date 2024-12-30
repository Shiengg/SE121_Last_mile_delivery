const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Shop = require('../models/Shop');
const VehicleType = require('../models/VehicleType');

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Route API is working' });
});

// Get all routes
router.get('/', async (req, res) => {
    try {
        console.log('GET /routes request received');
        
        const routes = await Route.find();
        
        // Populate manually using shop_id
        const populatedRoutes = await Promise.all(routes.map(async (route) => {
            const shop1 = await Shop.findOne({ shop_id: route.shop1_id });
            const shop2 = await Shop.findOne({ shop_id: route.shop2_id });
            const vehicleType = await VehicleType.findOne({ code: route.vehicle_type_id });
            
            return {
                ...route.toObject(),
                shop1_details: shop1,
                shop2_details: shop2,
                vehicle_type_details: vehicleType
            };
        }));

        console.log('Routes found:', populatedRoutes);

        res.json({
            success: true,
            data: populatedRoutes
        });
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching routes',
            error: error.message
        });
    }
});

// Delete route
router.delete('/:id', async (req, res) => {
    try {
        const route = await Route.findByIdAndDelete(req.params.id);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }
        res.json({
            success: true,
            message: 'Route deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting route',
            error: error.message
        });
    }
});

module.exports = router;
