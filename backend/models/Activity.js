const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'ASSIGN']
  },
  target_type: {
    type: String,
    required: true,
    enum: ['ROUTE', 'SHOP', 'USER', 'VEHICLE']
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  affectedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  }
}, {
  timestamps: true
});

// Indexes
activitySchema.index({ performedBy: 1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ action: 1, target_type: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ affectedUsers: 1 });

module.exports = mongoose.model('Activity', activitySchema); 