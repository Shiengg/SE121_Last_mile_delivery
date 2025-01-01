const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({
    code: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    nation_code: {
        type: String,
        required: true,
        default: 'VN'
    }
}, {
    collection: 'Province',
    timestamps: true
});

module.exports = mongoose.model('Province', provinceSchema); 