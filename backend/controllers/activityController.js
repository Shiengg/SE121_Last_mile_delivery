const Activity = require('../models/Activity');

exports.logActivity = async (action, target_type, description, userId, details = {}) => {
  try {
    await Activity.create({
      performedBy: userId,
      action,
      target_type,
      description,
      details,
      status: 'unread'
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    let query = {};
    
    // Nếu là DeliveryStaff, chỉ lấy các activities liên quan đến họ
    if (req.user.role === 'DeliveryStaff') {
      query = {
        $or: [
          { performedBy: req.user._id },
          { affectedUsers: req.user._id },
          { target_type: 'ROUTE' } // DeliveryStaff có thể xem tất cả route activities
        ]
      };
    }

    const activities = await Activity.find(query)
      .populate('performedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const formattedActivities = activities.map(activity => ({
      _id: activity._id,
      type: activity.type || activity.action,
      description: activity.description,
      createdAt: activity.createdAt,
      performedBy: activity.performedBy 
        ? (activity.performedBy.fullName || activity.performedBy.username)
        : 'System'
    }));

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
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
    await Activity.deleteMany({});
    
    res.json({
      success: true,
      message: 'Notifications cleared successfully'
    });
  } catch (error) {
    console.error('Error in clearNotifications:', error);
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