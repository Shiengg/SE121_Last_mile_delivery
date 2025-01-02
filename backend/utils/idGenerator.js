const Route = require('../models/Route');

// Hàm tạo route_id với format: RT + số tăng dần (6 chữ số)
exports.generateRouteId = async () => {
    try {
        // Tìm route cuối cùng để lấy số thứ tự
        const lastRoute = await Route.findOne()
            .sort({ route_id: -1 })
            .select('route_id');

        let nextNumber = 1;
        
        if (lastRoute) {
            // Nếu đã có route, lấy số từ route_id cuối và tăng lên 1
            const lastNumber = parseInt(lastRoute.route_id.replace('RT', ''));
            nextNumber = lastNumber + 1;
        }

        // Format số thành chuỗi 6 chữ số (RT000001, RT000002,...)
        const routeId = `RT${nextNumber.toString().padStart(6, '0')}`;

        // Kiểm tra xem route_id đã tồn tại chưa
        const existingRoute = await Route.findOne({ route_id: routeId });
        if (existingRoute) {
            // Nếu đã tồn tại, thử lại với số tiếp theo
            return generateRouteId();
        }

        return routeId;
    } catch (error) {
        console.error('Error generating route ID:', error);
        throw new Error('Failed to generate route ID');
    }
};

// Hàm kiểm tra route_id có hợp lệ không
exports.validateRouteId = (routeId) => {
    // Route ID phải có format: RT + 6 chữ số
    const routeIdRegex = /^RT\d{6}$/;
    return routeIdRegex.test(routeId);
}; 