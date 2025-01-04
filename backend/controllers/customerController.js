const Route = require('../models/Route');
const Shop = require('../models/Shop');

// Get route by route_code
exports.getRouteByCode = async (req, res) => {
  try {
    console.log('Searching for route code:', req.params.code);

    // Validate route code format
    if (!req.params.code.match(/^RT\d{6}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route code format. Route code should be in format RT000000'
      });
    }

    // Tìm route
    const route = await Route.findOne({ route_code: req.params.code })
      .populate('delivery_staff_id', 'fullName phone')
      .lean();

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `No route found with code ${req.params.code}`
      });
    }

    console.log('Found route:', route);

    // Lấy danh sách shop_ids
    const shopIds = route.shops.map(shop => shop.shop_id);
    console.log('Shop IDs:', shopIds);

    // Tìm thông tin shops
    const shops = await Shop.find({ 
      shop_id: { $in: shopIds } 
    }).lean();

    console.log('Found shops:', shops);

    // Tạo map của shops
    const shopMap = {};
    shops.forEach(shop => {
      shopMap[shop.shop_id] = {
        name: shop.name,
        address: shop.address,
        phone: shop.phone
      };
    });

    // Map thông tin shop vào route
    const enrichedShops = route.shops.map(shop => ({
      ...shop,
      shop_id: {
        ...shopMap[shop.shop_id] || {
          name: 'Unknown Shop',
          address: 'N/A',
          phone: 'N/A'
        },
        id: shop.shop_id // Giữ lại shop_id gốc
      }
    }));

    const responseData = {
      ...route,
      shops: enrichedShops
    };

    console.log('Final response data:', responseData);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    // Log lỗi chỉ khi là lỗi server thực sự
    if (error.name !== 'ValidationError' && error.name !== 'CastError') {
      console.error('Detailed error:', {
        message: error.message,
        stack: error.stack,
        route_code: req.params.code
      });
    }

    // Trả về response phù hợp với loại lỗi
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid route code format',
        error: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid route code format',
        error: 'Route code must be a string'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching route',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get route status
exports.getRouteStatus = async (req, res) => {
  try {
    console.log('Fetching status for route:', req.params.code);

    // Validate route code format
    if (!req.params.code.match(/^RT\d{6}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route code format. Route code should be in format RT000000'
      });
    }

    const route = await Route.findOne({ route_code: req.params.code })
      .select('status delivery_staff_id updatedAt')
      .populate('delivery_staff_id', 'fullName phone')
      .lean();

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `No route found with code ${req.params.code}`
      });
    }

    console.log('Found route status:', route);

    res.json({
      success: true,
      data: {
        status: route.status,
        delivery_staff: route.delivery_staff_id,
        last_updated: route.updatedAt
      }
    });

  } catch (error) {
    // Log lỗi chỉ khi là lỗi server thực sự
    if (error.name !== 'ValidationError' && error.name !== 'CastError') {
      console.error('Error in getRouteStatus:', {
        message: error.message,
        stack: error.stack,
        route_code: req.params.code
      });
    }

    // Trả về response phù hợp với loại lỗi
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid route code format',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching route status',
      error: error.message
    });
  }
};
