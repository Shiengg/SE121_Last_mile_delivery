const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shop_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    shop_name: {
        type: String,
        required: true,
        trim: true
    },
    country_id: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        ref: 'Nation'
    },
    province_id: {
        type: String,
        required: true,
        trim: true,
        ref: 'Province'
    },
    district_id: {
        type: String,
        required: true,
        trim: true,
        ref: 'District'
    },
    ward_code: {
        type: String,
        required: true,
        trim: true,
        ref: 'Ward'
    },
    house_number: {
        type: String,
        required: true,
        trim: true
    },
    street: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: {
            latitude: Number,
            longitude: Number
        },
        required: true
    },
    shop_type: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'Shop',
    timestamps: true
});

// Indexes
shopSchema.index({ shop_id: 1 }, { unique: true });
shopSchema.index({ country_id: 1 });
shopSchema.index({ province_id: 1 });
shopSchema.index({ district_id: 1 });
shopSchema.index({ ward_code: 1 });
shopSchema.index({ shop_type: 1 });
shopSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

module.exports = mongoose.model('Shop', shopSchema); 