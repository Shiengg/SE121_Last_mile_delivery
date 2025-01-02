const mongoose = require('mongoose');
require('dotenv').config();
const Route = require('../models/Route');

const validStatuses = ['pending', 'assigned', 'delivering', 'delivered', 'cancelled', 'failed'];

async function fixRouteStatuses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const routes = await Route.find({});
        console.log(`Found ${routes.length} routes`);

        for (const route of routes) {
            if (!validStatuses.includes(route.status)) {
                console.log(`Route ${route.route_code} has invalid status: ${route.status}`);
                route.status = 'pending'; // Set default status
                await route.save();
                console.log(`Fixed status for route ${route.route_code}`);
            }
        }

        console.log('Finished fixing route statuses');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixRouteStatuses(); 