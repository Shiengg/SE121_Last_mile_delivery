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

exports.updateVehicleType = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedVehicle = await VehicleType.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedVehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle type not found'
            });
        }

        res.json({
            success: true,
            data: updatedVehicle
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating vehicle type',
            error: error.message
        });
    }
};

exports.deleteVehicleType = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedVehicle = await VehicleType.findByIdAndDelete(id);

        if (!deletedVehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle type not found'
            });
        }

        res.json({
            success: true,
            message: 'Vehicle type deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error deleting vehicle type',
            error: error.message
        });
    }
};
