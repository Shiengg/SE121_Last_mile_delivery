const Route = require('../models/Route');
const Shop = require('../models/Shop');
const VehicleType = require('../models/VehicleType');
const mapService = require('../services/mapService');
const { generateRouteId } = require('../utils/idGenerator');
const User = require('../models/User');
const logActivity = require('../utils/logActivity');

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

exports.createRoute = async (req, res) => {
    try {
        const { shop_ids, vehicle_type_id } = req.body;
        console.log('Creating route with data:', { shop_ids, vehicle_type_id });

        // Validate input
        if (!shop_ids || !Array.isArray(shop_ids) || shop_ids.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 shops are required'
            });
        }

        // Lấy thông tin chi tiết của các shop
        const shops = await Shop.find({ shop_id: { $in: shop_ids } });
        console.log('Found shops:', shops);
        
        if (shops.length !== shop_ids.length) {
            return res.status(400).json({
                success: false,
                message: 'Some shops not found'
            });
        }

        // Validate coordinates
        for (const shop of shops) {
            if (!mapService.validateCoordinates(shop.latitude, shop.longitude)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid coordinates for shop ${shop.shop_id}: ${shop.latitude},${shop.longitude}`
                });
            }
        }

        // Tính toán route sử dụng Here Maps API
        const routeDetails = await mapService.calculateRoute(shops);
        console.log('Route details:', routeDetails);

        // Tạo route mới
        const newRoute = new Route({
            route_code: await generateRouteId(),
            shops: shop_ids.map((shop_id, index) => ({
                shop_id,
                order: index + 1
            })),
            vehicle_type_id,
            distance: routeDetails.distance,
            polyline: routeDetails.polyline,
            status: 'pending'
        });

        await newRoute.save();
        console.log('Route created:', newRoute);

        res.status(201).json({
            success: true,
            data: newRoute
        });
    } catch (error) {
        console.error('Error creating route:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating route',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.getAllRoutes = async (req, res) => {
    try {
        const routes = await Route.find()
            .populate([
                {
                    path: 'delivery_staff_id',
                    select: 'username fullName phone email'
                },
                {
                    path: 'shops.shop_id',
                    model: 'Shop',
                    select: 'shop_id shop_name latitude longitude'
                },
                {
                    path: 'vehicle_type_id',
                    model: 'VehicleType',
                    select: 'code name'
                }
            ])
            .sort({ createdAt: -1 })
            .lean();

        // Transform routes với thông tin đầy đủ
        const transformedRoutes = routes.map(route => ({
            _id: route._id,
            route_code: route.route_code,
            shops: route.shops.map(shop => ({
                shop_id: shop.shop_id?.shop_id || shop.shop_id,
                shop_name: shop.shop_id?.shop_name || 'Unknown Shop',
                order: shop.order,
                coordinates: {
                    latitude: shop.shop_id?.latitude,
                    longitude: shop.shop_id?.longitude
                }
            })).sort((a, b) => a.order - b.order),
            vehicle_type: route.vehicle_type_id?.name || route.vehicle_type_id,
            vehicle_type_code: route.vehicle_type_id?.code,
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
        const { status: newStatus } = req.body;

        const route = await Route.findById(id);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        // Kiểm tra trạng thái mới có hợp lệ không
        if (!Object.values(ROUTE_STATUS).includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Kiểm tra xem có được phép chuyển từ trạng thái hiện tại sang trạng thái mới không
        const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[route.status] || [];
        if (!allowedNextStatuses.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${route.status} to ${newStatus}`,
                allowedStatuses: allowedNextStatuses
            });
        }

        // Cập nhật trạng thái
        const updatedRoute = await Route.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true }
        ).populate([
            {
                path: 'shop1_id',
                select: 'shop_id shop_name latitude longitude'
            },
            {
                path: 'shop2_id',
                select: 'shop_id shop_name latitude longitude'
            },
            {
                path: 'vehicle_type_id',
                select: 'code name'
            }
        ]);

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
        const deliveryStaff = await User.findOne({
            _id: delivery_staff_id,
            role: 'DeliveryStaff',
            status: 'active'
        });

        if (!deliveryStaff) {
            return res.status(404).json({
                success: false,
                message: 'Delivery staff not found or inactive'
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
                select: 'shop_name shop_id latitude longitude'
            }
        ]);

        // Log activity
        await logActivity(
            'ASSIGN',
            'ROUTE',
            `Route ${route.route_code} assigned to ${deliveryStaff.fullName}`,
            req.user._id,
            {
                entityId: route._id,
                entityCode: route.route_code,
                assignedTo: delivery_staff_id
            }
        );

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
