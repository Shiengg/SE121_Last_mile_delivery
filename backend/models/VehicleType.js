const mongoose = require('mongoose');

const vehicleTypeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Middleware để tự động cập nhật updated_at
vehicleTypeSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

const VehicleType = mongoose.model('VehicleType', vehicleTypeSchema);

module.exports = VehicleType; 