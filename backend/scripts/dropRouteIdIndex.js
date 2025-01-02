const mongoose = require('mongoose');
require('dotenv').config();

async function dropRouteIdIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('routes');
        await collection.dropIndex('route_id_1');
        console.log('Successfully dropped route_id index');
    } catch (error) {
        if (error.code === 27) {
            console.log('Index does not exist, no need to drop');
        } else {
            console.error('Error dropping index:', error);
        }
    } finally {
        await mongoose.disconnect();
    }
}

dropRouteIdIndex(); 