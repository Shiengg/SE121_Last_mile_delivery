const Province = require('../models/Province');

exports.getAllProvinces = async (req, res) => {
    try {
        console.log('getAllProvinces called by user:', req.user?._id);
        
        const provinces = await Province.find()
            .select('code name nation_code')
            .sort({ name: 1 })
            .lean();

        console.log(`Found ${provinces.length} provinces`);

        const transformedProvinces = provinces.map(province => ({
            province_id: province.code.toString(),
            name: province.name,
            code: province.code
        }));

        console.log('Sending response with transformed provinces');

        res.json({
            success: true,
            data: transformedProvinces
        });
    } catch (error) {
        console.error('Error in getAllProvinces:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching provinces',
            error: error.message
        });
    }
}; 