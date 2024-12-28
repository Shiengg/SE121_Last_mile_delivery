const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username : {
        type: String,
        require: true,
        unique: true,
        trim: true,
    },
    password : {
        type: String,
        require: true
    },
    role : {
        type: String,
        enum: ['Admin','DeliveryStaff', 'Customer'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
      },
});

module.exports = mongoose.model('User', userSchema);