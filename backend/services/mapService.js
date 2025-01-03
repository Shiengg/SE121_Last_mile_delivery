const axios = require('axios');

const HERE_API_KEY = process.env.HERE_API_KEY;
if (!HERE_API_KEY) {
    throw new Error('HERE_API_KEY is not defined in environment variables');
}

const ROUTING_API_URL = 'https://router.hereapi.com/v8/routes';

class MapService {
    async calculateRouteDetails(waypoints) {
        try {
            if (waypoints.length < 2) {
                throw new Error('At least 2 waypoints are required');
            }

            // Format origin và destination
            const origin = `${waypoints[0].latitude},${waypoints[0].longitude}`;
            const destination = `${waypoints[waypoints.length - 1].latitude},${waypoints[waypoints.length - 1].longitude}`;

            // Format via points (các điểm trung gian)
            const via = waypoints.slice(1, -1).map(point => 
                `via=${point.latitude},${point.longitude}`
            ).join('&');

            // Tạo URL với đúng format
            const url = `${ROUTING_API_URL}?` + 
                `transportMode=truck` +
                `&origin=${origin}` +
                `&destination=${destination}` +
                (via ? `&${via}` : '') +
                `&return=polyline,summary,actions` +
                `&apiKey=${HERE_API_KEY}`;

            console.log('Calling HERE Maps API with URL:', url);

            const response = await axios.get(url);

            if (!response.data || !response.data.routes || !response.data.routes[0]) {
                console.error('Invalid HERE API response:', response.data);
                throw new Error('Invalid response from HERE API');
            }

            const route = response.data.routes[0];
            const sections = route.sections;

            // Tính tổng khoảng cách và lấy polyline
            let totalDistance = 0;
            const sectionDistances = [];
            let fullPolyline = '';

            sections.forEach(section => {
                const sectionDistance = section.summary.length / 1000; // Convert to km
                totalDistance += sectionDistance;
                sectionDistances.push(sectionDistance);
                fullPolyline += section.polyline;
            });

            const roundedDistance = Math.round(totalDistance * 100) / 100;

            console.log('Route calculation successful:', {
                totalDistance: roundedDistance,
                sections: sections.length,
                polylineLength: fullPolyline.length,
                sectionDistances
            });

            return {
                totalDistance: roundedDistance,
                sectionDistances,
                polyline: fullPolyline
            };
        } catch (error) {
            console.error('Error calculating route details:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new MapService();
