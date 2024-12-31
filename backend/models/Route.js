const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    route_code: {
        type: String,
        required: true,
        unique: true
    },
    shop1_id: {
        type: String,
        ref: 'Shop',
        required: true
    },
    shop2_id: {
        type: String,
        ref: 'Shop',
        required: true
    },
    vehicle_type_id: {
        type: String,
        ref: 'VehicleType',
        required: true
    },
    distance: {
        type: Number,
        required: true
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
}, {
    collection: 'Route'
});

routeSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model('Route', routeSchema);