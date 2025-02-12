const VehicleType = require('../models/VehicleType');
const { logActivity } = require('./activityController');

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
        const { code, name, description, status = 'active' } = req.body;

        // Validate required fields
        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message: 'Code and name are required'
            });
        }

        // Create new vehicle type
        const vehicleType = new VehicleType({
            code,
            name,
            description,
            status
        });

        await vehicleType.save();

        // Log activity
        await logActivity(
            'CREATE',
            'VEHICLE',
            `New vehicle type ${name} was added`,
            req.user._id,
            {
                entityId: vehicleType._id,
                entityCode: code,
                details: {
                    name
                }
            }
        );

        res.status(201).json({
            success: true,
            message: 'Vehicle type created successfully',
            data: vehicleType
        });
    } catch (error) {
        console.error('Error in createVehicleType:', error);
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

        // Log activity
        await logActivity(
            'UPDATE',
            'VEHICLE',
            `Vehicle type ${updatedVehicle.code} was updated`,
            req.user._id,
            {
                entityId: updatedVehicle._id,
                entityName: updatedVehicle.code,
                changes: updateData
            }
        );

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

        // Log activity
        await logActivity(
            'DELETE',
            'VEHICLE',
            `Vehicle type ${deletedVehicle.code} was deleted`,
            req.user._id,
            {
                entityId: deletedVehicle._id,
                entityName: deletedVehicle.code
            }
        );

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
