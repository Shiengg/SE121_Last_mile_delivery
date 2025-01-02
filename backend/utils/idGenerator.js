const Route = require('../models/Route');

// Hàm tạo route_code với format: RT + số tăng dần (6 chữ số)
exports.generateRouteId = async () => {
    try {
        // Tìm route cuối cùng để lấy số thứ tự
        const lastRoute = await Route.findOne()
            .sort({ route_code: -1 })
            .select('route_code')
            .lean();

        console.log('Last route found:', lastRoute);

        let nextNumber = 1;
        
        if (lastRoute && lastRoute.route_code) {
            // Lấy số từ route_code cuối cùng
            const matches = lastRoute.route_code.match(/RT(\d{6})/);
            if (matches && matches[1]) {
                const lastNumber = parseInt(matches[1], 10);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
            console.log('Next number will be:', nextNumber);
        }

        // Format số thành chuỗi 6 chữ số
        const routeCode = `RT${nextNumber.toString().padStart(6, '0')}`;
        console.log('Generated route code:', routeCode);

        // Kiểm tra xem route_code đã tồn tại chưa
        const existingRoute = await Route.findOne({ route_code: routeCode }).lean();
        if (existingRoute) {
            console.log('Route code already exists, trying next number');
            // Nếu đã tồn tại, tăng số lên 1 và thử lại
            return exports.generateRouteId();
        }

        return routeCode;
    } catch (error) {
        console.error('Error generating route ID:', error);
        throw new Error('Failed to generate route ID');
    }
};

// Hàm kiểm tra route_code có hợp lệ không
exports.validateRouteCode = (routeCode) => {
    // Route code phải có format: RT + 6 chữ số
    const routeCodeRegex = /^RT\d{6}$/;
    return routeCodeRegex.test(routeCode);
}; 