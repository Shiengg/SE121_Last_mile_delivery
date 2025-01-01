const Ward = require('../models/Ward');

exports.getAllWards = async (req, res) => {
    try {
        console.log('getAllWards called by user:', req.user?._id);
        console.log('Query params:', req.query);
        
        const { district_id } = req.query;
        
        let query = {};
        if (district_id) {
            // Tìm kiếm chính xác district_id, có thể cần format lại district_id
            const formattedDistrictId = district_id.padStart(3, '0');
            query = { 
                $or: [
                    { district_id },
                    { district_id: formattedDistrictId }
                ]
            };
        }
        
        console.log('MongoDB query:', query);
        
        const wards = await Ward.find(query)
            .select('code name district_id')
            .sort({ name: 1 })
            .lean();

        console.log(`Found ${wards.length} wards:`, wards);

        const transformedWards = wards.map(ward => ({
            ward_code: ward.code, // ward code đã có format "00001"
            name: ward.name,
            district_id: ward.district_id
        }));

        console.log('Sending transformed wards:', transformedWards);

        res.json({
            success: true,
            data: transformedWards
        });
    } catch (error) {
        console.error('Error in getAllWards:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wards',
            error: error.message
        });
    }
}; 