const axios = require('axios');

class MapService {
    constructor() {
        this.apiKey = process.env.HERE_API_KEY;
        this.baseUrl = 'https://router.hereapi.com/v8';
        
        if (!this.apiKey) {
            console.error('HERE_API_KEY is not defined in environment variables');
        }
    }

    async calculateRoute(shops) {
        try {
            // Tạo waypoints từ danh sách shops
            const waypoints = shops.map(shop => 
                `${shop.latitude},${shop.longitude}`
            ).join('&waypoint=');

            const url = `${this.baseUrl}/routes?transportMode=truck&return=polyline,summary&waypoint=${waypoints}&apiKey=${this.apiKey}`;

            // Gọi Here Maps Routing API
            const response = await axios.get(url);

            if (!response.data || !response.data.routes || !response.data.routes[0]) {
                throw new Error('No route found');
            }

            const route = response.data.routes[0];
            const sections = route.sections;

            // Tính tổng khoảng cách
            const totalDistance = sections.reduce(
                (sum, section) => sum + section.summary.length,
                0
            );

            // Lấy encoded polyline của route
            const polyline = route.sections.map(section => 
                section.polyline
            ).join('');

            return {
                distance: totalDistance / 1000, // Chuyển đổi từ mét sang km
                polyline: polyline
            };
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid HERE Maps API key');
            } else if (error.response?.status === 429) {
                throw new Error('HERE Maps API rate limit exceeded');
            }
            
            throw new Error(`Failed to calculate route: ${error.message}`);
        }
    }

    validateCoordinates(latitude, longitude) {
        return !isNaN(latitude) && 
               !isNaN(longitude) && 
               latitude >= -90 && 
               latitude <= 90 && 
               longitude >= -180 && 
               longitude <= 180;
    }
}

module.exports = new MapService();
