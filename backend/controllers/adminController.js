const Shop = require('../models/Shop');
const Route = require('../models/Route');
const VehicleType = require('../models/VehicleType');
const User = require('../models/User');
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

        // Thêm query để đếm số DeliveryStaff
        const deliveryStaffCount = await User.countDocuments({ role: 'DeliveryStaff' });
        
        const stats = {
            shops: shopCount,
            routes: routeCount,
            vehicles: vehicleCount,
            deliveryStaff: deliveryStaffCount
        };

        res.status(200).json({
            success: true,
            data: stats
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

exports.getDeliveryStaff = async (req, res) => {
    try {
        const deliveryStaff = await User.find(
            { role: 'DeliveryStaff' },
            'username fullName email phone avatar status createdAt'
        ).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: deliveryStaff
        });
    } catch (error) {
        console.error('Error fetching delivery staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery staff',
            error: error.message
        });
    }
};
