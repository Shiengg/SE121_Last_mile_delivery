const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    route_code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    shop1_id: {
        type: String,
        required: true,
        ref: 'Shop'
    },
    shop2_id: {
        type: String,
        required: true,
        ref: 'Shop'
    },
    vehicle_type_id: {
        type: String,
        required: true,
        ref: 'VehicleType'
    },
    distance: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'delivering', 'delivered'],
        default: 'active',
        index: true
    }
}, {
    collection: 'Route',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('Route', routeSchema);