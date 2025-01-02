const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    route_code: {
        type: String,
        required: true,
        unique: true
    },
    shops: [{
        shop_id: {
            type: String,
            required: true,
            ref: 'Shop'
        },
        order: {
            type: Number,
            required: true
        }
    }],
    vehicle_type_id: {
        type: String,
        required: true,
        ref: 'VehicleType'
    },
    distance: {
        type: Number,
        required: true
    },
    polyline: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'delivering', 'delivered', 'cancelled', 'failed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Xóa index cũ nếu tồn tại
routeSchema.pre('save', async function() {
    try {
        await this.collection.dropIndex('route_id_1');
    } catch (error) {
        // Bỏ qua lỗi nếu index không tồn tại
        if (error.code !== 27) {
            throw error;
        }
    }
});

module.exports = mongoose.model('Route', routeSchema);