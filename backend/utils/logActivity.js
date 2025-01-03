const Activity = require('../models/Activity');

const logActivity = async (action, target_type, description, user_id, details = {}) => {
    try {
        const activity = new Activity({
            user_id,
            action,
            target_type,
            description,
            details
        });

        await activity.save();
        console.log('Activity logged:', {
            action,
            target_type,
            description,
            user_id
        });

        return activity;
    } catch (error) {
        console.error('Error logging activity:', error);
        // Không throw error để không ảnh hưởng đến luồng chính của ứng dụng
        return null;
    }
};

module.exports = logActivity; 