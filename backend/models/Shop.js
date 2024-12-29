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
    address: {
        street: String,
        ward: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ward',
            required: true
        },
        district: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'District',
            required: true
        },
        province: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Province',
            required: true
        }
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
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
shopSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop; 