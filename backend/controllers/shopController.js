const Shop = require('../models/Shop');
const { logActivity } = require('./activityController');

exports.getAllShops = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        // Tạo query với index
        const searchQuery = search ? {
            $or: [
                { shop_id: new RegExp(search, 'i') },
                { shop_name: new RegExp(search, 'i') },
                { street: new RegExp(search, 'i') }
            ]
        } : {};

        // Sử dụng Promise.all để chạy song song 2 query
        const [total, shops] = await Promise.all([
            Shop.countDocuments(searchQuery),
            Shop.find(searchQuery)
                .select('shop_id shop_name street ward_code district_id province_id latitude longitude shop_type status') // Chỉ lấy các trường cần thiết
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
        ]);

        res.json({
            success: true,
            data: shops,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
                limit
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
        const { id } = req.params;
        const updateData = req.body;

        const updatedShop = await Shop.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedShop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Log activity
        await logActivity(
            'UPDATE',
            'SHOP',
            `Shop ${updatedShop.name} was updated`,
            req.user._id,
            {
                entityId: updatedShop._id,
                entityName: updatedShop.name,
                changes: updateData
            }
        );

        res.json({
            success: true,
            data: updatedShop
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating shop',
            error: error.message
        });
    }
};

exports.deleteShop = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedShop = await Shop.findByIdAndDelete(id);

        if (!deletedShop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Log activity
        await logActivity(
            'DELETE',
            'SHOP',
            `Shop ${deletedShop.shop_name} was deleted`,
            req.user._id,
            {
                entityId: deletedShop._id,
                entityName: deletedShop.shop_name,
                details: {
                    shop_id: deletedShop.shop_id,
                    location: `${deletedShop.street}, ${deletedShop.ward_code}`
                }
            }
        );

        res.json({
            success: true,
            message: 'Shop deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error deleting shop',
            error: error.message
        });
    }
};
