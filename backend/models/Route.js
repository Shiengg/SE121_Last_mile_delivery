const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    route_code: {
        type: String,
        required: true,
        unique: true
    },
    start_point: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ward',
        required: true
    },
    end_point: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ward',
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
});

// Middleware để tự động cập nhật updated_at
routeSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

const Route = mongoose.model('Route', routeSchema);

module.exports = Route; 