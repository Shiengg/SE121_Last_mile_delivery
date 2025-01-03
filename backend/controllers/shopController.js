const Shop = require('../models/Shop');
const { logActivity } = require('./activityController');

exports.getAllShops = async (req, res) => {
    try {
        const { ward_code, status, page = 1, limit = 10 } = req.query;
        
        // Xây dựng query
        let query = {};
        
        // Lọc theo ward_code nếu có
        if (ward_code) {
            query.ward_code = ward_code;
        }
        
        // Lọc theo status nếu có
        if (status) {
            query.status = status;
        }

        console.log('Shop query:', query);

        // Tính toán skip cho pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Đếm tổng số documents thỏa mãn query
        const total = await Shop.countDocuments(query);

        // Lấy data với pagination
        const shops = await Shop.find(query)
            .select('shop_id shop_name country_id province_id district_id ward_code house_number street latitude longitude shop_type status')
            .sort({ shop_id: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Tính tổng số trang
        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            data: shops,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages
            }
        });
    } catch (error) {
        console.error('Error in getAllShops:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shops',
            error: error.message
        });
    }
};

const getNextShopId = async (ward_code) => {
    try {
        // Tìm shop cuối cùng có ward_code tương ứng
        const lastShop = await Shop.findOne({
            shop_id: new RegExp(`^${ward_code}`, 'i')
        }).sort({ shop_id: -1 });

        if (!lastShop) {
            // Nếu chưa có shop nào với ward_code này
            return `${ward_code}001`;
        }

        // Lấy 3 số cuối của shop_id cuối cùng
        const lastNumber = parseInt(lastShop.shop_id.slice(-3));
        
        // Kiểm tra xem có shop nào với ID mới không
        let nextNumber = lastNumber + 1;
        let newShopId;
        let existingShop;
        
        do {
            newShopId = `${ward_code}${nextNumber.toString().padStart(3, '0')}`;
            existingShop = await Shop.findOne({ shop_id: newShopId });
            nextNumber++;
        } while (existingShop);

        return newShopId;
    } catch (error) {
        console.error('Error generating next shop ID:', error);
        throw error;
    }
};

exports.createShop = async (req, res) => {
    try {
        const shopData = req.body;

        // Kiểm tra ward_code
        if (!shopData.ward_code || shopData.ward_code.length !== 5) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ward code format'
            });
        }

        // Tạo shop mới (shop_id sẽ được tạo tự động trong pre-save middleware)
        const newShop = new Shop(shopData);
        await newShop.save();

        // Log activity
        await logActivity(
            'CREATE',
            'SHOP',
            `New shop ${newShop.shop_name} was added`,
            req.user._id,
            {
                entityId: newShop._id,
                entityName: newShop.shop_name,
                details: {
                    shop_id: newShop.shop_id,
                    location: `${newShop.street}, ${newShop.ward_code}`
                }
            }
        );

        res.status(201).json({
            success: true,
            data: newShop
        });
    } catch (error) {
        console.error('Error creating shop:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error creating shop',
            error: error.message,
            details: error.errors
        });
    }
};

exports.updateShop = async (req, res) => {
    try {
        console.log('Update shop request:', {
            shopId: req.params.id,
            updateData: req.body
        });

        const shopData = req.body;

        // Validate required fields
        const requiredFields = ['shop_name', 'province_id', 'district_id', 'ward_code', 'street', 'latitude', 'longitude'];
        for (const field of requiredFields) {
            if (!shopData[field]) {
                return res.status(400).json({
                    success: false,
                    message: `${field} is required`
                });
            }
        }

        // Format data
        const formattedData = {
            ...shopData,
            province_id: shopData.province_id.toString().padStart(2, '0'),
            district_id: shopData.district_id.toString().padStart(3, '0'),
            latitude: parseFloat(shopData.latitude),
            longitude: parseFloat(shopData.longitude)
        };

        // Find and update shop
        const updatedShop = await Shop.findByIdAndUpdate(
            req.params.id,
            formattedData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!updatedShop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        console.log('Shop updated successfully:', updatedShop);

        // Log activity
        await logActivity({
            user_id: req.user._id,
            action: 'update',
            target_type: 'shop',
            target_id: updatedShop._id,
            details: `Updated shop ${updatedShop.shop_name}`
        });

        res.json({
            success: true,
            message: 'Shop updated successfully',
            data: updatedShop
        });
    } catch (error) {
        console.error('Error updating shop:', error);
        res.status(400).json({
            success: false,
            message: 'Error updating shop',
            error: error.message,
            details: error.errors
        });
    }
};

exports.deleteShop = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra shop có tồn tại không
        const shop = await Shop.findById(id);
        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Kiểm tra shop có đang được sử dụng trong route nào không
        const Route = require('../models/Route');
        const routeWithShop = await Route.findOne({
            'shops.shop_id': shop.shop_id
        });

        if (routeWithShop) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete shop that is assigned to a route'
            });
        }

        // Xóa shop
        await Shop.findByIdAndDelete(id);

        // Log activity
        await logActivity(
            'DELETE',
            'SHOP',
            `Shop ${shop.shop_name} was deleted`,
            req.user._id,
            {
                entityId: shop._id,
                entityName: shop.shop_name,
                details: {
                    shop_id: shop.shop_id,
                    location: `${shop.street}, ${shop.ward_code}`
                }
            }
        );

        res.json({
            success: true,
            message: 'Shop deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting shop:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting shop',
            error: error.message
        });
    }
};
