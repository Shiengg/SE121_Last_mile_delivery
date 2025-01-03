const axios = require('axios');

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1Ijoic2hpZW5nIiwiYSI6ImNtNTkwY3R4ZDNybHUyanNmM2hoaDAxa2oifQ.ZUcv_MrKBuTc2lZ2jyofmQ';
const MAPBOX_DIRECTIONS_API = 'https://api.mapbox.com/directions/v5/mapbox/driving';

class MapService {
    async calculateRouteDetails(waypoints) {
        try {
            if (waypoints.length < 2) {
                throw new Error('At least 2 waypoints are required');
            }

            let totalDistance = 0;
            const sectionDistances = [];

            // Tính toán khoảng cách tuần tự giữa các điểm
            for (let i = 0; i < waypoints.length - 1; i++) {
                const start = waypoints[i];
                const end = waypoints[i + 1];

                // Tạo URL cho Mapbox Directions API
                const url = `${MAPBOX_DIRECTIONS_API}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
                
                // Thêm các parameters
                const params = {
                    access_token: MAPBOX_ACCESS_TOKEN,
                    geometries: 'geojson',
                    overview: 'full'
                };

                console.log(`Calculating distance from point ${i} to point ${i + 1}`);
                const response = await axios.get(url, { params });

                if (!response.data || !response.data.routes || !response.data.routes[0]) {
                    throw new Error('Invalid response from Mapbox API');
                }

                // Lấy khoảng cách của đoạn đường (convert từ meters sang kilometers)
                const sectionDistance = response.data.routes[0].distance / 1000;
                sectionDistances.push(sectionDistance);
                totalDistance += sectionDistance;
            }

            return {
                totalDistance: Math.round(totalDistance * 100) / 100, // Làm tròn 2 chữ số thập phân
                sectionDistances,
                polyline: null // Không cần polyline nữa
            };
        } catch (error) {
            console.error('Error calculating route details:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new MapService();
