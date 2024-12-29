const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({
    code: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    nation_code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        ref: 'Nation'
    }
}, {
    collection: 'Province',
    timestamps: true
});

// Index để tối ưu tìm kiếm
provinceSchema.index({ nation_code: 1 });
provinceSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Province', provinceSchema); 