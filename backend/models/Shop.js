const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shop_id: {
        type: String,
        required: true,
        unique: true,
        index: true
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

// Thêm compound index cho shop_id và ward_code
shopSchema.index({ shop_id: 1, ward_code: 1 }, { unique: true });

// Middleware để kiểm tra trùng lặp shop_id trước khi lưu
shopSchema.pre('save', async function(next) {
    try {
        const existingShop = await this.constructor.findOne({ shop_id: this.shop_id });
        if (existingShop && existingShop._id.toString() !== this._id.toString()) {
            throw new Error(`Shop with ID ${this.shop_id} already exists`);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Các index khác
shopSchema.index({ shop_name: 1 });
shopSchema.index({ street: 1 });
shopSchema.index({ status: 1 });

module.exports = mongoose.model('Shop', shopSchema); 