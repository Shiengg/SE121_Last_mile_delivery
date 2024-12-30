const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shop_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    country_id: {
        type: String,
        required: true,
        ref: 'Nation'
    },
    province_id: {
        type: String,
        required: true,
        ref: 'Province'
    },
    district_id: {
        type: String,
        required: true,
        ref: 'District'
    },
    ward_code: {
        type: String,
        required: true,
        ref: 'Ward'
    },
    house_number: String,
    street: String,
    latitude: Number,
    longitude: Number,
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
    collection: 'Shop'
});

shopSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model('Shop', shopSchema); 