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

exports.createShop = async (req, res) => {
    try {
        const newShop = new Shop(req.body);
        await newShop.save();

        // Log activity
        await logActivity(
            'CREATE',
            'SHOP',
            `New shop ${newShop.name} was added`,
            req.user._id,
            {
                entityId: newShop._id,
                entityName: newShop.name
            }
        );

        res.status(201).json({
            success: true,
            data: newShop
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating shop',
            error: error.message
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
