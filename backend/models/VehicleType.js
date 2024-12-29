const mongoose = require('mongoose');

const vehicleTypeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'VehicleType',
    timestamps: true
});

// Index
vehicleTypeSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('VehicleType', vehicleTypeSchema); 