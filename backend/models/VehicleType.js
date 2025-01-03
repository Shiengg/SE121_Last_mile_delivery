const mongoose = require('mongoose');

const vehicleTypeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        primary: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    collection: 'VehicleType',
    timestamps: true
});

module.exports = mongoose.model('VehicleType', vehicleTypeSchema); 