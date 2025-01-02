const Route = require('../models/Route');
const Shop = require('../models/Shop');
const VehicleType = require('../models/VehicleType');
const mapService = require('../services/mapService');
const { generateRouteId } = require('../utils/idGenerator');

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

        // Validate input
        if (!shop_ids || !Array.isArray(shop_ids) || shop_ids.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 shops are required'
            });
        }

        // Lấy thông tin chi tiết của các shop
        const shops = await Shop.find({ shop_id: { $in: shop_ids } });
        
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
                    message: `Invalid coordinates for shop ${shop.shop_id}`
                });
            }
        }

        // Tính toán route sử dụng Here Maps API
        const routeDetails = await mapService.calculateRoute(shops);

        // Tạo route mới
        const newRoute = new Route({
            route_id: await generateRouteId(),
            shops: shop_ids.map((shop_id, index) => ({
                shop_id,
                order: index + 1
            })),
            vehicle_type_id,
            distance: routeDetails.distance,
            polyline: routeDetails.polyline,
            status: 'delivering'
        });

        await newRoute.save();

        res.status(201).json({
            success: true,
            data: newRoute
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
        console.log('Fetching all routes...');
        
        // Fetch routes without populate first
        const routes = await Route.find().lean();
        
        console.log('Found routes:', routes);

        // Lấy tất cả shop_id cần thiết
        const shopIds = routes.flatMap(route => [route.shop1_id, route.shop2_id])
            .filter(id => id); // Lọc bỏ null/undefined

        const vehicleTypeIds = routes
            .map(route => route.vehicle_type_id)
            .filter(id => id);

        console.log('Fetching data for shops:', shopIds);
        console.log('Fetching data for vehicle types:', vehicleTypeIds);
        
        // Fetch shops and vehicle types in bulk
        const [shops, vehicleTypes] = await Promise.all([
            shopIds.length > 0 
                ? Shop.find({ shop_id: { $in: shopIds } })
                    .select('shop_id shop_name latitude longitude')
                    .lean()
                : [],
            vehicleTypeIds.length > 0
                ? VehicleType.find({ code: { $in: vehicleTypeIds } })
                    .select('code name')
                    .lean()
                : []
        ]);

        // Create lookup maps for faster access
        const shopMap = new Map(shops.map(shop => [shop.shop_id, shop]));
        const vehicleTypeMap = new Map(vehicleTypes.map(vt => [vt.code, vt]));

        // Transform routes with related data
        const transformedRoutes = routes.map(route => {
            const shop1Data = shopMap.get(route.shop1_id);
            const shop2Data = shopMap.get(route.shop2_id);
            const vehicleType = vehicleTypeMap.get(route.vehicle_type_id);

            return {
                _id: route._id,
                route_code: route.route_code,
                shops: [
                    {
                        shop_id: route.shop1_id,
                        shop_name: shop1Data?.shop_name || 'Unknown Shop',
                        coordinates: shop1Data ? {
                            latitude: shop1Data.latitude,
                            longitude: shop1Data.longitude
                        } : null
                    },
                    {
                        shop_id: route.shop2_id,
                        shop_name: shop2Data?.shop_name || 'Unknown Shop',
                        coordinates: shop2Data ? {
                            latitude: shop2Data.latitude,
                            longitude: shop2Data.longitude
                        } : null
                    }
                ],
                vehicle_type: vehicleType?.name || route.vehicle_type_id,
                vehicle_type_code: route.vehicle_type_id,
                distance: route.distance || 0,
                status: route.status || 'unknown',
                created_at: route.created_at,
                updated_at: route.updated_at
            };
        });

        console.log(`Successfully transformed ${transformedRoutes.length} routes`);

        res.json({
            success: true,
            data: transformedRoutes
        });
    } catch (error) {
        console.error('Error in getAllRoutes:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error fetching routes',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
        const { id } = req.params;
        const { shipper_id } = req.body;

        const route = await Route.findById(id);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        // Chỉ có thể assign route ở trạng thái pending
        if (route.status !== ROUTE_STATUS.PENDING) {
            return res.status(400).json({
                success: false,
                message: 'Can only assign routes with pending status'
            });
        }

        // Cập nhật route với shipper và trạng thái mới
        const updatedRoute = await Route.findByIdAndUpdate(
            id,
            {
                shipper_id,
                status: ROUTE_STATUS.ASSIGNED
            },
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
