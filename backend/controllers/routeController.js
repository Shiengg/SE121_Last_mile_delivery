const Route = require('../models/Route');
const Shop = require('../models/Shop');
const VehicleType = require('../models/VehicleType');
const mapService = require('../services/mapService');
const { generateRouteId } = require('../utils/idGenerator');

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
        const { status } = req.body;

        if (!['delivering', 'delivered'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const route = await Route.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.json({
            success: true,
            data: route
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
