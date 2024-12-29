const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    route_code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    shops: [{
        type: String,
        ref: 'Shop',
        required: true
    }],
    vehicle_type_code: {
        type: String,
        required: true,
        ref: 'VehicleType'
    },
    distance: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    collection: 'Route',
    timestamps: true
});

// Indexes
routeSchema.index({ route_code: 1 }, { unique: true });
routeSchema.index({ vehicle_type_code: 1 });
routeSchema.index({ shops: 1 });

module.exports = mongoose.model('Route', routeSchema); 