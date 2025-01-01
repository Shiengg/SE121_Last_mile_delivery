const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE']
  },
  module: {
    type: String,
    required: true,
    enum: ['VEHICLE', 'ROUTE', 'SHOP']
  },
  description: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'module'
    },
    entityName: String,
    changes: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index để tối ưu truy vấn
activitySchema.index({ createdAt: -1 });
activitySchema.index({ type: 1, module: 1 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity; 