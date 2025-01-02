const axios = require('axios');
const MapService = require('../services/mapService');
const Shop = require('../models/Shop');
require('dotenv').config();
const mongoose = require('mongoose');

async function testRoute() {
    try {
        // Kết nối database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Lấy 2 shop từ database để test
        const shops = await Shop.find().limit(2);
        
        if (shops.length < 2) {
            console.error('Not enough shops in database');
            return;
        }

        console.log('Testing with shops:', shops.map(s => ({
            shop_id: s.shop_id,
            name: s.shop_name,
            coordinates: `${s.latitude},${s.longitude}`
        })));

        // Test MapService
        const mapService = new MapService();
        const routeDetails = await mapService.calculateRoute(shops);
        console.log('Route details from MapService:', routeDetails);

        // Verify với Google Maps Distance Matrix API để cross-check
        const googleApiKey = 'YOUR_GOOGLE_API_KEY'; // Nếu có
        if (googleApiKey) {
            const origins = `${shops[0].latitude},${shops[0].longitude}`;
            const destinations = `${shops[1].latitude},${shops[1].longitude}`;
            const googleResponse = await axios.get(
                `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${googleApiKey}`
            );
            
            if (googleResponse.data.rows[0].elements[0].distance) {
                const googleDistance = googleResponse.data.rows[0].elements[0].distance.value / 1000; // Convert to km
                console.log('Google Maps distance:', googleDistance, 'km');
                console.log('Difference:', Math.abs(googleDistance - routeDetails.distance), 'km');
            }
        }

        // Visualize route on map
        const mapUrl = `https://wego.here.com/directions/drive/${shops[0].latitude},${shops[0].longitude}/${shops[1].latitude},${shops[1].longitude}`;
        console.log('\nVisualize route on HERE Maps:', mapUrl);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testRoute(); 