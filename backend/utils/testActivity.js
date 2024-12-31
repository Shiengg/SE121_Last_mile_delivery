const Activity = require('../models/Activity');
const mongoose = require('mongoose');

const createTestActivity = async () => {
    try {
        const testActivity = new Activity({
            type: 'CREATE',
            module: 'VEHICLE',
            description: 'Test activity',
            performedBy: new mongoose.Types.ObjectId(), // Thay bằng một user ID thực
            metadata: {
                entityId: new mongoose.Types.ObjectId(),
                entityName: 'TEST_VEHICLE'
            }
        });

        await testActivity.save();
        console.log('Test activity created successfully');
    } catch (error) {
        console.error('Error creating test activity:', error);
    }
};

module.exports = createTestActivity; 