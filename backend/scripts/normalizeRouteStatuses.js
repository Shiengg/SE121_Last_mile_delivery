const mongoose = require('mongoose');
require('dotenv').config();
const Route = require('../models/Route');

async function normalizeRouteStatuses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const routes = await Route.find({});
        console.log(`Found ${routes.length} routes`);

        for (const route of routes) {
            const oldStatus = route.status;
            // Chuẩn hóa status
            route.status = route.status.trim().toLowerCase();
            
            if (oldStatus !== route.status) {
                console.log(`Updating route ${route.route_code} status from "${oldStatus}" to "${route.status}"`);
                await route.save();
            }
        }

        console.log('Finished normalizing route statuses');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

normalizeRouteStatuses(); 