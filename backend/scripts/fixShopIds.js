const fs = require('fs');
const path = require('path');

async function fixShopIds() {
    try {
        // Đọc file JSON
        const filePath = path.join(__dirname, '../../generate_shops/data/shops_cleaned.json');
        const rawData = fs.readFileSync(filePath);
        const shops = JSON.parse(rawData);

        // Object để theo dõi số thứ tự của mỗi ward
        const wardCounters = {};

        // Xử lý từng shop
        const fixedShops = shops.map(shop => {
            // Đảm bảo ward_code có đúng format (5 chữ số)
            const ward_code = shop.ward_code.padStart(5, '0');
            
            // Khởi tạo counter cho ward nếu chưa có
            if (!wardCounters[ward_code]) {
                wardCounters[ward_code] = 1;
            }

            // Tạo shop_id mới theo format: ward_code + số thứ tự (3 chữ số)
            const newShopId = `${ward_code}${wardCounters[ward_code].toString().padStart(3, '0')}`;
            wardCounters[ward_code]++;

            // Format lại các ID khác và thêm status
            return {
                ...shop,
                shop_id: newShopId,
                ward_code: ward_code,
                province_id: shop.province_id.toString().padStart(2, '0'),
                district_id: shop.district_id.toString().padStart(3, '0'),
                status: 'active', // Thêm status active cho tất cả shop
                shop_type: shop.shop_type || 'retail', // Đảm bảo có shop_type
                categories: shop.categories || [] // Đảm bảo có categories
            };
        });

        // Ghi file mới
        const outputPath = path.join(__dirname, '../../generate_shops/data/shops_fixed.json');
        fs.writeFileSync(outputPath, JSON.stringify(fixedShops, null, 2));

        console.log('Processed shops:', fixedShops.length);
        console.log('Unique ward codes:', Object.keys(wardCounters).length);
        console.log('File saved to:', outputPath);

        // Kiểm tra trùng lặp
        const shopIds = new Set();
        const duplicates = [];
        fixedShops.forEach(shop => {
            if (shopIds.has(shop.shop_id)) {
                duplicates.push(shop.shop_id);
            }
            shopIds.add(shop.shop_id);
        });

        if (duplicates.length > 0) {
            console.error('Found duplicate shop_ids:', duplicates);
        } else {
            console.log('No duplicate shop_ids found');
        }

    } catch (error) {
        console.error('Error processing file:', error);
    }
}

// Chạy script
fixShopIds(); 