const mongoose = require('mongoose');

const nationSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'Nation',
    timestamps: true
});

module.exports = mongoose.model('Nation', nationSchema); 