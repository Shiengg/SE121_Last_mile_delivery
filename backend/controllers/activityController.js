const Activity = require('../models/Activity');

exports.logActivity = async (type, module, description, userId, metadata) => {
  try {
    const activity = new Activity({
      type,
      module,
      description,
      performedBy: userId,
      metadata
    });
    await activity.save();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('performedBy', 'name')
      .lean();

    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      type: activity.type,
      module: activity.module,
      description: activity.description,
      performedBy: activity.performedBy.name,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      timeAgo: getTimeAgo(activity.createdAt)
    }));

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

exports.clearAllActivities = async (req, res) => {
  try {
    await Activity.deleteMany({});
    res.json({
      success: true,
      message: 'All activities cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing activities',
      error: error.message
    });
  }
};

exports.clearNotifications = async (req, res) => {
  try {
    // Xóa tất cả activities
    await Activity.deleteMany({});
    
    res.json({
      success: true,
      message: 'Notifications cleared successfully'
    });
  } catch (error) {
    console.error('Error in clearNotifications:', error); // Thêm log để debug
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications',
      error: error.message
    });
  }
};

// Helper function to format time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
} 