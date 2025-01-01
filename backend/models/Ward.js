const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
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
    district_id: {
        type: String,
        required: true,
        ref: 'District',
        index: true
    }
}, {
    collection: 'Ward',
    timestamps: true
});

module.exports = mongoose.model('Ward', wardSchema); 