const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shop_id: {
        type: String,
        required: true,
        unique: true
    },
    shop_name: {
        type: String,
        required: true
    },
    country_id: {
        type: String,
        default: 'VN'
    },
    province_id: {
        type: String,
        required: true
    },
    district_id: {
        type: String,
        required: true
    },
    ward_code: {
        type: String,
        required: true
    },
    house_number: {
        type: String,
        default: ''
    },
    street: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    shop_type: {
        type: String,
        enum: ['retail', 'wholesale', 'other'],
        default: 'retail'
    },
    categories: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    collection: 'Shop',
    timestamps: true
});

// Chỉ thêm index cho các trường chưa có
shopSchema.index({ shop_name: 1 });
shopSchema.index({ street: 1 });
shopSchema.index({ status: 1 });

module.exports = mongoose.model('Shop', shopSchema); 