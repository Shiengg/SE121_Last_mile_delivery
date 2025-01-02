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
            if (!shops || shops.length < 2) {
                throw new Error('At least 2 shops are required');
            }

            console.log('Calculating route for shops:', shops.map(s => ({
                id: s.shop_id,
                name: s.shop_name,
                coords: `${s.latitude},${s.longitude}`
            })));

            // Validate coordinates
            shops.forEach(shop => {
                if (!this.validateCoordinates(shop.latitude, shop.longitude)) {
                    throw new Error(`Invalid coordinates for shop ${shop.shop_id}: ${shop.latitude},${shop.longitude}`);
                }
            });

            // Tính toán khoảng cách giữa các cặp shop liên tiếp
            let totalDistance = 0;
            let combinedPolyline = '';

            // Lặp qua các cặp shop liên tiếp
            for (let i = 0; i < shops.length - 1; i++) {
                const origin = `${shops[i].latitude},${shops[i].longitude}`;
                const destination = `${shops[i + 1].latitude},${shops[i + 1].longitude}`;

                const url = `${this.baseUrl}/routes?` + 
                    `transportMode=truck` +
                    `&origin=${origin}` +
                    `&destination=${destination}` +
                    `&return=polyline,summary` +
                    `&apikey=${this.apiKey}`;

                console.log(`Calculating distance from shop ${i + 1} to shop ${i + 2}`);
                console.log('HERE Maps API URL:', url);

                const response = await axios.get(url);
                console.log('HERE Maps API Response:', response.data);

                if (!response.data?.routes?.[0]) {
                    throw new Error(`No route found between shops ${i + 1} and ${i + 2}`);
                }

                const route = response.data.routes[0];
                const sections = route.sections;

                // Cộng dồn khoảng cách
                const segmentDistance = sections.reduce((sum, section) => 
                    sum + section.summary.length, 0
                );
                totalDistance += segmentDistance;

                // Nối các polyline
                const segmentPolyline = sections.map(section => 
                    section.polyline
                ).join('');
                combinedPolyline += (combinedPolyline ? ',' : '') + segmentPolyline;
            }

            return {
                distance: totalDistance / 1000, // Chuyển đổi từ mét sang km
                polyline: combinedPolyline
            };
        } catch (error) {
            console.error('MapService error:', error);
            if (error.response?.status === 401) {
                throw new Error('Invalid HERE Maps API key');
            } else if (error.response?.status === 429) {
                throw new Error('HERE Maps API rate limit exceeded');
            } else if (error.response?.data) {
                throw new Error(`HERE Maps API error: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
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
