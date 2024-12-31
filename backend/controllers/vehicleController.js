const VehicleType = require('../models/VehicleType');

exports.getAllVehicleTypes = async (req, res) => {
    try {
        const vehicleTypes = await VehicleType.find({});
        res.json({
            success: true,
            data: vehicleTypes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching vehicle types',
            error: error.message
        });
    }
};

exports.createVehicleType = async (req, res) => {
    try {
        const newVehicleType = new VehicleType(req.body);
        await newVehicleType.save();
        res.status(201).json({
            success: true,
            data: newVehicleType
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating vehicle type',
            error: error.message
        });
    }
};
