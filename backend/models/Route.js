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
        enum: [
            'pending',     // Chờ xử lý/phân công
            'assigned',    // Đã phân công cho shipper
            'delivering',  // Đang giao hàng
            'delivered',   // Đã giao xong
            'cancelled',   // Đã hủy
            'failed'       // Giao hàng thất bại
        ],
        default: 'pending',
        index: true
    }
}, {
    collection: 'Route',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Thêm middleware pre-save để validate status
routeSchema.pre('save', function(next) {
    const validStatuses = ['pending', 'assigned', 'delivering', 'delivered', 'cancelled', 'failed'];
    if (!validStatuses.includes(this.status)) {
        next(new Error(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`));
    }
    next();
});

module.exports = mongoose.model('Route', routeSchema);