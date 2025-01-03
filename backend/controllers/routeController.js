const Route = require('../models/Route');
const Shop = require('../models/Shop');
const VehicleType = require('../models/VehicleType');
const mapService = require('../services/mapService');
const { generateRouteId } = require('../utils/idGenerator');
const User = require('../models/User');
const { logActivity } = require('../controllers/activityController');
const Activity = require('../models/Activity');

// Định nghĩa các trạng thái và luồng chuyển đổi ở đầu file
const ROUTE_STATUS = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    DELIVERING: 'delivering',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED: 'failed'
};

// Định nghĩa luồng chuyển đổi trạng thái
const ALLOWED_STATUS_TRANSITIONS = {
    [ROUTE_STATUS.PENDING]: [ROUTE_STATUS.ASSIGNED, ROUTE_STATUS.CANCELLED],
    [ROUTE_STATUS.ASSIGNED]: [ROUTE_STATUS.DELIVERING, ROUTE_STATUS.CANCELLED],
    [ROUTE_STATUS.DELIVERING]: [ROUTE_STATUS.DELIVERED, ROUTE_STATUS.FAILED],
    [ROUTE_STATUS.DELIVERED]: [], // Không thể chuyển sang trạng thái khác
    [ROUTE_STATUS.CANCELLED]: [], // Không thể chuyển sang trạng thái khác
    [ROUTE_STATUS.FAILED]: [ROUTE_STATUS.PENDING] // Có thể thử lại từ đầu
};

// Hàm tính khoảng cách giữa 2 điểm dùng Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
};

const deg2rad = (deg) => {
    return deg * (Math.PI/180);
};

exports.createRoute = async (req, res) => {
    try {
        const { shops, vehicle_type_id } = req.body;

        // Validate input
        if (!shops || !Array.isArray(shops) || shops.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 shops are required for a route'
            });
        }

        // Kiểm tra vehicle type
        const vehicleType = await VehicleType.findOne({ code: vehicle_type_id });
        if (!vehicleType) {
            return res.status(400).json({
                success: false,
                message: 'Invalid vehicle type'
            });
        }

        // Lấy thông tin chi tiết của shops theo thứ tự
        const shopDetails = await Promise.all(
            shops.map(shop => 
                Shop.findOne({ shop_id: shop.shop_id })
                    .select('shop_id shop_name latitude longitude')
            )
        );

        // Kiểm tra shops tồn tại
        if (shopDetails.some(shop => !shop)) {
            return res.status(400).json({
                success: false,
                message: 'One or more shop IDs are invalid'
            });
        }

        // Chuẩn bị waypoints cho HERE Maps API
        const waypoints = shopDetails.map(shop => ({
            latitude: parseFloat(shop.latitude),
            longitude: parseFloat(shop.longitude)
        }));

        // Tính toán route với HERE Maps API
        const routeDetails = await mapService.calculateRouteDetails(waypoints);

        // Tạo route mới
        const route = new Route({
            route_code: await generateRouteId(),
            shops: shops.map((shop, index) => ({
                shop_id: shop.shop_id,
                order: index + 1  // Gán order theo thứ tự trong mảng
            })),
            vehicle_type_id: vehicleType.code,
            distance: routeDetails.totalDistance,
            polyline: routeDetails.polyline,
            section_distances: routeDetails.sectionDistances,
            status: 'pending'
        });

        await route.save();

        // Tạo response với thông tin chi tiết
        const routeWithDetails = {
            ...route.toObject(),
            vehicle_type: vehicleType.name,
            shops: shopDetails.map((shop, index) => ({
                shop_id: shop.shop_id,
                shop_name: shop.shop_name,
                order: index + 1,
                coordinates: {
                    latitude: shop.latitude,
                    longitude: shop.longitude
                },
                distance_to_next: index < routeDetails.sectionDistances.length 
                    ? routeDetails.sectionDistances[index] 
                    : null
            }))
        };

        // Log activity
        await logActivity(
            'CREATE',
            'ROUTE',
            `New route ${route.route_code} was created with total distance ${routeDetails.totalDistance.toFixed(2)} km`,
            req.user._id,
            {
                entityId: route._id,
                entityCode: route.route_code,
                details: {
                    shops: shopDetails.map(shop => ({
                        shop_id: shop.shop_id,
                        shop_name: shop.shop_name
                    })),
                    distance: routeDetails.totalDistance,
                    vehicle_type: vehicleType.code
                }
            }
        );

        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: routeWithDetails
        });
    } catch (error) {
        console.error('Error creating route:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating route',
            error: error.message
        });
    }
};

exports.getAllRoutes = async (req, res) => {
    try {
        // Lấy tất cả routes và chỉ populate delivery_staff_id
        const routes = await Route.find()
            .populate('delivery_staff_id', 'username fullName phone email')
            .sort({ createdAt: -1 })
            .lean();

        // Lấy tất cả shop_ids từ các routes
        const shopIds = routes.flatMap(route => route.shops.map(shop => shop.shop_id));
        const uniqueShopIds = [...new Set(shopIds)];

        // Lấy thông tin shops một lần
        const shops = await Shop.find({ shop_id: { $in: uniqueShopIds } })
            .select('shop_id shop_name latitude longitude')
            .lean();

        // Lấy thông tin vehicle types
        const vehicleTypes = await VehicleType.find({ 
            code: { $in: routes.map(r => r.vehicle_type_id) } 
        }).lean();

        // Tạo maps để dễ dàng lookup
        const shopMap = new Map(shops.map(shop => [shop.shop_id, shop]));
        const vehicleTypeMap = new Map(vehicleTypes.map(vt => [vt.code, vt]));

        // Transform routes với thông tin đầy đủ
        const transformedRoutes = routes.map(route => ({
            _id: route._id,
            route_code: route.route_code,
            shops: route.shops.map(shop => {
                const shopData = shopMap.get(shop.shop_id);
                return {
                    shop_id: shop.shop_id,
                    shop_name: shopData?.shop_name || 'Unknown Shop',
                    order: shop.order,
                    coordinates: {
                        latitude: shopData?.latitude,
                        longitude: shopData?.longitude
                    }
                };
            }).sort((a, b) => a.order - b.order),
            vehicle_type: vehicleTypeMap.get(route.vehicle_type_id)?.name || route.vehicle_type_id,
            vehicle_type_code: route.vehicle_type_id,
            delivery_staff_id: route.delivery_staff_id,
            assigned_at: route.assigned_at,
            distance: route.distance,
            status: route.status,
            created_at: route.createdAt
        }));

        res.json({
            success: true,
            data: transformedRoutes
        });
    } catch (error) {
        console.error('Error in getAllRoutes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching routes',
            error: error.message
        });
    }
};

exports.updateRouteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const route = await Route.findById(id);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        // Kiểm tra quyền: chỉ Admin hoặc DeliveryStaff được assign có thể cập nhật
        if (req.user.role === 'DeliveryStaff') {
            if (!route.delivery_staff_id || route.delivery_staff_id.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this route'
                });
            }
        }

        // Kiểm tra luồng trạng thái hợp lệ
        const validTransitions = {
            'assigned': ['delivering', 'cancelled'],
            'delivering': ['delivered', 'failed'],
            'delivered': [],
            'failed': ['pending'],
            'cancelled': []
        };

        if (!validTransitions[route.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${route.status} to ${status}`
            });
        }

        // Cập nhật trạng thái
        const updatedRoute = await Route.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('delivery_staff_id', 'username fullName');

        // Log activity
        await Activity.create({
            performedBy: req.user._id,
            action: 'UPDATE',
            target_type: 'ROUTE',
            description: `Route ${route.route_code} status updated to ${status}`,
            details: {
                entityId: route._id,
                entityCode: route.route_code,
                oldStatus: route.status,
                newStatus: status
            },
            status: 'unread'
        });

        res.json({
            success: true,
            message: 'Route status updated successfully',
            data: updatedRoute
        });
    } catch (error) {
        console.error('Error updating route status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating route status',
            error: error.message
        });
    }
};

exports.deleteRoute = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Deleting route with ID:', id);

        const route = await Route.findById(id);
        
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        // Kiểm tra trạng thái route trước khi xóa
        const nonDeletableStatuses = [
            ROUTE_STATUS.ASSIGNED,
            ROUTE_STATUS.DELIVERING,
            ROUTE_STATUS.DELIVERED
        ];

        if (nonDeletableStatuses.includes(route.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete route in ${route.status} status. Only routes in pending, cancelled, or failed status can be deleted.`
            });
        }

        await Route.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Route deleted successfully',
            data: route
        });
    } catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting route',
            error: error.message
        });
    }
};

exports.assignRoute = async (req, res) => {
    try {
        const { route_id, delivery_staff_id } = req.body;
        console.log('Assigning route:', { route_id, delivery_staff_id });

        // Validate input
        if (!route_id || !delivery_staff_id) {
            return res.status(400).json({
                success: false,
                message: 'Route ID and Delivery Staff ID are required'
            });
        }

        // Kiểm tra route tồn tại và có status là pending
        const route = await Route.findById(route_id);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        if (route.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending routes can be assigned'
            });
        }

        // Kiểm tra delivery staff tồn tại và có role phù hợp
        const deliveryStaff = await User.findById(delivery_staff_id);
        console.log('Found delivery staff:', deliveryStaff);

        if (!deliveryStaff) {
            return res.status(404).json({
                success: false,
                message: 'Delivery staff not found'
            });
        }

        if (deliveryStaff.role !== 'DeliveryStaff') {
            return res.status(403).json({
                success: false,
                message: 'Selected user is not a delivery staff'
            });
        }

        if (deliveryStaff.status === 'inactive') {
            return res.status(400).json({
                success: false,
                message: 'Selected delivery staff is inactive'
            });
        }

        // Cập nhật route
        const updatedRoute = await Route.findByIdAndUpdate(
            route_id,
            {
                delivery_staff_id,
                status: 'assigned',
                assigned_at: new Date()
            },
            { new: true }
        ).populate([
            {
                path: 'delivery_staff_id',
                select: 'username fullName phone'
            },
            {
                path: 'shops.shop_id',
                model: 'Shop',
                localField: 'shops.shop_id',
                foreignField: 'shop_id',
                select: 'shop_name shop_id latitude longitude'
            }
        ]);

        // Log activity
        await Activity.create({
            performedBy: req.user._id,
            action: 'ASSIGN',
            target_type: 'ROUTE',
            description: `You have been assigned to route ${route.route_code}`,
            details: {
                entityId: route._id,
                entityCode: route.route_code,
                routeDetails: {
                    shops: route.shops,
                    distance: route.distance,
                    vehicle_type: route.vehicle_type_id
                }
            },
            affectedUsers: [delivery_staff_id],
            status: 'unread'
        });

        res.json({
            success: true,
            message: 'Route assigned successfully',
            data: updatedRoute
        });
    } catch (error) {
        console.error('Error assigning route:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning route',
            error: error.message
        });
    }
};

exports.updateRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicle_type_id, status } = req.body;

        console.log('Updating route:', { id, vehicle_type_id, status });

        const route = await Route.findById(id);
        
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        // Kiểm tra status mới có hợp lệ không
        const validStatuses = Object.values(ROUTE_STATUS);
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
                validStatuses
            });
        }

        // Kiểm tra luồng chuyển đổi trạng thái
        if (status && status !== route.status) {
            console.log('Current status:', route.status);
            console.log('New status:', status);
            console.log('Allowed transitions:', ALLOWED_STATUS_TRANSITIONS[route.status]);

            const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[route.status] || [];
            if (!allowedNextStatuses.includes(status)) {
                console.log('Invalid transition detected');
                return res.status(400).json({
                    success: false,
                    message: `Cannot change status from ${route.status} to ${status}. Allowed next statuses are: ${allowedNextStatuses.join(', ')}`
                });
            }
        }

        // Chỉ cập nhật các trường được phép
        const updateData = {};
        if (vehicle_type_id) updateData.vehicle_type_id = vehicle_type_id;
        if (status) updateData.status = status;

        const updatedRoute = await Route.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Route updated successfully',
            data: updatedRoute
        });
    } catch (error) {
        console.error('Error updating route:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating route',
            error: error.message
        });
    }
};

exports.claimRoute = async (req, res) => {
    try {
        const { route_id } = req.body;
        const staff_id = req.user._id; // Lấy ID của staff đang đăng nhập

        // Kiểm tra route tồn tại và có status là pending
        const route = await Route.findById(route_id);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        if (route.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This route is no longer available'
            });
        }

        // Kiểm tra xem user có phải là delivery staff không
        const staff = await User.findOne({
            _id: staff_id,
            role: 'DeliveryStaff',
            status: 'active'
        });

        if (!staff) {
            return res.status(403).json({
                success: false,
                message: 'Only active delivery staff can claim routes'
            });
        }

        // Kiểm tra số lượng route đang active của staff
        const activeRoutes = await Route.countDocuments({
            delivery_staff_id: staff_id,
            status: { $in: ['assigned', 'delivering'] }
        });

        const MAX_ACTIVE_ROUTES = 5; // Có thể điều chỉnh số này
        if (activeRoutes >= MAX_ACTIVE_ROUTES) {
            return res.status(400).json({
                success: false,
                message: `You cannot have more than ${MAX_ACTIVE_ROUTES} active routes`
            });
        }

        // Cập nhật route
        const updatedRoute = await Route.findByIdAndUpdate(
            route_id,
            {
                delivery_staff_id: staff_id,
                status: 'assigned',
                assigned_at: new Date()
            },
            { new: true }
        ).populate([
            {
                path: 'delivery_staff_id',
                select: 'username fullName phone'
            },
            {
                path: 'shops.shop_id',
                select: 'shop_name shop_id latitude longitude'
            }
        ]);

        // Log activity
        await logActivity(
            'CLAIM',
            'ROUTE',
            `Route ${route.route_code} claimed by ${staff.fullName}`,
            staff_id,
            {
                entityId: route._id,
                entityCode: route.route_code
            }
        );

        res.json({
            success: true,
            message: 'Route claimed successfully',
            data: updatedRoute
        });
    } catch (error) {
        console.error('Error claiming route:', error);
        res.status(500).json({
            success: false,
            message: 'Error claiming route',
            error: error.message
        });
    }
};

exports.getRouteById = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id)
            .populate('delivery_staff_id', 'username fullName')
            .populate({
                path: 'shops.shop_id',
                model: 'Shop',
                localField: 'shops.shop_id',
                foreignField: 'shop_id',
                select: 'shop_id shop_name address latitude longitude'
            });

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        // Transform data để đảm bảo shops được sắp xếp theo order
        const transformedRoute = {
            ...route.toObject(),
            shops: route.shops
                .sort((a, b) => a.order - b.order)
                .map(shop => ({
                    ...shop,
                    shop_details: shop.shop_id // shop_id bây giờ chứa thông tin chi tiết của shop
                }))
        };

        res.status(200).json({
            success: true,
            data: transformedRoute
        });
    } catch (error) {
        console.error('Error getting route:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting route',
            error: error.message
        });
    }
};
