const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'DeliveryStaff', 'Customer'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, {
    collection: 'Users'
});

module.exports = mongoose.model('User', userSchema);