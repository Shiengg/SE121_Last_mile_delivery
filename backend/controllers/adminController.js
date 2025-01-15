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

exports.updateDeliveryStaffStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, role: 'DeliveryStaff' },
            { status },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Delivery staff not found'
            });
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Error updating delivery staff status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating status',
            error: error.message
        });
    }
};
