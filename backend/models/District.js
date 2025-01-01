const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    province_id: {
        type: String,
        required: true,
        ref: 'Province',
        index: true
    }
}, {
    collection: 'District',
    timestamps: true
});

module.exports = mongoose.model('District', districtSchema); 