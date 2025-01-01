const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shop_id: {
        type: String,
        unique: true,
        trim: true,
        validate: {
            validator: async function(value) {
                if (this.isNew) {
                    const existingShop = await this.constructor.findOne({ shop_id: value });
                    return !existingShop;
                }
                const existingShop = await this.constructor.findOne({ 
                    shop_id: value,
                    _id: { $ne: this._id }
                });
                return !existingShop;
            },
            message: props => `Shop with ID ${props.value} already exists`
        }
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

// Xóa các index cũ
await mongoose.connection.collections['Shop'].dropIndexes();

// Tạo lại các index
shopSchema.index({ shop_id: 1 }, { 
    unique: true,
    background: true,
    name: 'unique_shop_id'
});

shopSchema.index({ shop_name: 1 });
shopSchema.index({ street: 1 });
shopSchema.index({ status: 1 });

// Pre-save middleware
shopSchema.pre('save', async function(next) {
    try {
        // Chỉ tạo shop_id cho document mới
        if (this.isNew && !this.shop_id) {
            const lastShop = await this.constructor.findOne({
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

        // Kiểm tra trùng lặp
        if (this.isNew || this.isModified('shop_id')) {
            const existingShop = await this.constructor.findOne({ 
                shop_id: this.shop_id,
                _id: { $ne: this._id }
            });
            
            if (existingShop) {
                throw new Error(`Shop with ID ${this.shop_id} already exists`);
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Shop', shopSchema); 