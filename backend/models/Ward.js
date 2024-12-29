const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
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
    district_id: {
        type: String,
        required: true,
        trim: true,
        ref: 'District'
    }
}, {
    collection: 'Ward',
    timestamps: true
});

// Indexes để tối ưu tìm kiếm
wardSchema.index({ district_id: 1 });
wardSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Ward', wardSchema); 