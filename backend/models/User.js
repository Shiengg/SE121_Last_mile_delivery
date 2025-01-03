const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['Admin', 'DeliveryStaff', 'Customer']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    fullName: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'Users'
});

const User = mongoose.model('User', userSchema);
module.exports = User;