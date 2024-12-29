const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    province_id: {
        type: String,
        required: true,
        trim: true,
        ref: 'Province'
    }
}, {
    collection: 'District',
    timestamps: true
});

// Index để tối ưu tìm kiếm
districtSchema.index({ province_id: 1 });
districtSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('District', districtSchema); 