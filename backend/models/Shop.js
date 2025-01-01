const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shop_id: {
        type: String,
        unique: true,
        trim: true
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
        trim: true
    },
    district_id: {
        type: String,
        required: true,
        trim: true
    },
    ward_code: {
        type: String,
        required: true,
        trim: true
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

// Pre-save middleware
shopSchema.pre('save', async function(next) {
    try {
        const Shop = mongoose.model('Shop');

        // Chỉ tạo shop_id cho document mới
        if (this.isNew && !this.shop_id) {
            const lastShop = await Shop.findOne({
                shop_id: new RegExp(`^${this.ward_code}`, 'i')
            }).sort({ shop_id: -1 });

            if (!lastShop) {
                this.shop_id = `${this.ward_code}001`;
            } else {
                const lastNumber = parseInt(lastShop.shop_id.slice(-3));
                const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
                this.shop_id = `${this.ward_code}${nextNumber}`;
            }
        }

        // Kiểm tra unique shop_id
        if (this.isModified('shop_id')) {
            const existingShop = await Shop.findOne({
                shop_id: this.shop_id,
                _id: { $ne: this._id }
            });
            
            if (existingShop) {
                throw new Error('Shop ID must be unique');
            }
        }

        // Format IDs
        if (this.isModified('province_id')) {
            this.province_id = this.province_id.toString().padStart(2, '0');
        }
        if (this.isModified('district_id')) {
            this.district_id = this.district_id.toString().padStart(3, '0');
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Indexes
shopSchema.index({ shop_id: 1 }, { unique: true });
shopSchema.index({ shop_name: 1 });
shopSchema.index({ street: 1 });
shopSchema.index({ status: 1 });

// Tạo model
const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop; 