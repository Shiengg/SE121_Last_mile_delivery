const Shop = require('../models/Shop');
const Route = require('../models/Route');
const VehicleType = require('../models/VehicleType');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
    try {
        console.log('Fetching dashboard stats...');

        // Sử dụng Promise.all để thực hiện các truy vấn đồng thời
        const [shopCount, routeCount, vehicleCount] = await Promise.all([
            Shop.countDocuments(),
            Route.countDocuments(),
            VehicleType.countDocuments()
        ]);

        console.log('Collection counts:', {
            shops: shopCount,
            routes: routeCount,
            vehicles: vehicleCount
        });

        res.status(200).json({
            success: true,
            data: {
                shops: shopCount,
                routes: routeCount,
                vehicles: vehicleCount
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};
