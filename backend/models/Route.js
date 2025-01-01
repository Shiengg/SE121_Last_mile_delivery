const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    shops: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop'
    }],
    vehicle_type: {
        type: String,
        ref: 'VehicleType'
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

module.exports = mongoose.model('Route', routeSchema);