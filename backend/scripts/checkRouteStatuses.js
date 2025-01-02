const mongoose = require('mongoose');
require('dotenv').config();
const Route = require('../models/Route');

async function checkRouteStatuses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const routes = await Route.find({});
        console.log(`Found ${routes.length} routes`);

        const statusCounts = {};
        routes.forEach(route => {
            statusCounts[route.status] = (statusCounts[route.status] || 0) + 1;
            console.log(`Route ${route.route_code}:`, {
                status: route.status,
                statusType: typeof route.status,
                statusLength: route.status.length,
                statusChars: Array.from(route.status).map(c => c.charCodeAt(0))
            });
        });

        console.log('\nStatus counts:', statusCounts);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkRouteStatuses(); 