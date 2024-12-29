const Shop = require('../models/Shop');
const Route = require('../models/Route');
const VehicleType = require('../models/VehicleType');
const mongoose = require('mongoose');

const getDashboardStats = async (req, res) => {
    try {
        console.log('Fetching dashboard stats...');

        const db = mongoose.connection.db;

        const [shopCount, routeCount, vehicleCount] = await Promise.all([
            db.collection('Shop').countDocuments(),
            db.collection('Route').countDocuments(),
            db.collection('VehicleType').countDocuments()
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

module.exports = {
    getDashboardStats
};
