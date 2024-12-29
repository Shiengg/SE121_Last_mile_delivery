const axios = require('axios');
const fs = require('fs').promises;
const crypto = require('crypto');
require('dotenv').config();

function generateObjectId() {
    return crypto.randomBytes(12).toString('hex');
}

function generateShopId(wardCode, index) {
    return `${wardCode}${String(index).padStart(3, '0')}`;
}

function parseAddress(item) {
    try {
        // Lấy địa chỉ đầy đủ từ HERE API
        const fullAddress = item.address.label;
        // Tách các phần của địa chỉ
        const parts = fullAddress.split(',').map(part => part.trim());
        
        // Phần đầu tiên thường là số nhà + tên đường
        const streetPart = parts[0];
        let houseNumber = '';
        let street = streetPart;

        // Tìm số nhà ở đầu địa chỉ
        const match = streetPart.match(/^(\d+[A-Za-z]?)\s+(.+)/);
        if (match) {
            houseNumber = match[1];
            street = match[2];
        }

        // Nếu không tìm thấy số nhà, thử tìm trong địa chỉ đầy đủ
        if (!houseNumber && item.address.houseNumber) {
            houseNumber = item.address.houseNumber;
        }

        // Nếu có street từ API, sử dụng nó
        if (item.address.street) {
            street = item.address.street;
        }

        return { houseNumber, street };
    } catch (error) {
        console.error('Error parsing address:', error);
        return { houseNumber: '', street: '' };
    }
}

function getShopType(categories) {
    const typeMap = {
        'shop': 'retail',
        'commercial': 'retail',
        'food-drink': 'restaurant',
        'restaurant': 'restaurant',
        'coffee': 'cafe',
        'supermarket': 'supermarket',
        'convenience': 'convenience',
        'pharmacy': 'pharmacy',
        'book': 'books',
        'clothing': 'fashion',
        'electronics': 'electronics'
    };

    if (!Array.isArray(categories)) {
        return 'retail';
    }

    for (const category of categories) {
        const categoryId = category.id ? category.id.toLowerCase() : '';
        for (const [key, value] of Object.entries(typeMap)) {
            if (categoryId.includes(key)) {
                return value;
            }
        }
    }
    
    return 'retail';
}

async function findShopsInWard(ward) {
    const HERE_API_KEY = process.env.HERE_API_KEY;
    const allShops = [];

    try {
        const queries = ['shop', 'store', 'retail'];

        for (const query of queries) {
            console.log(`\nSearching for "${query}" in ${ward.name}...`);
            
            const url = `https://discover.search.hereapi.com/v1/discover?q=${encodeURIComponent(query + ' ' + ward.name)}&in=circle:21.0285,105.8542;r=1000&limit=5&apiKey=${HERE_API_KEY}`;
            
            const response = await axios.get(url);
            
            if (response.data.items) {
                console.log(`Found ${response.data.items.length} results`);
                
                const shops = response.data.items.map((item, index) => {
                    const { houseNumber, street } = parseAddress(item);

                    return {
                        _id: generateObjectId(),
                        shop_id: generateShopId(ward.code, index + 1),
                        shop_name: item.title,
                        country_id: "VN",
                        province_id: ward.district_id.substring(0, 2),
                        district_id: ward.district_id,
                        ward_code: ward.code,
                        house_number: houseNumber,
                        street: street,
                        latitude: item.position.lat,
                        longitude: item.position.lng,
                        shop_type: getShopType(item.categories || [])
                    };
                });
                
                allShops.push(...shops);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Lọc bỏ các shop trùng lặp dựa trên tọa độ
        const uniqueShops = allShops.filter((shop, index, self) =>
            index === self.findIndex((s) => (
                s.latitude === shop.latitude && 
                s.longitude === shop.longitude
            ))
        );
        
        return uniqueShops.slice(0, 3);
            
    } catch (error) {
        console.error(`Error searching shops in ${ward.name}:`, error.message);
        return [];
    }
}

async function testWithSampleWards() {
    try {
        console.log('Reading wards data...');
        const wardsData = JSON.parse(
            await fs.readFile('./data/last_mile_delivery.Ward.json', 'utf8')
        );
        
        const testWards = wardsData.slice(0, 3);
        const allShops = [];
        
        for (const ward of testWards) {
            console.log(`\nProcessing ward ${ward.name}`);
            
            const shops = await findShopsInWard(ward);
            
            if (shops.length > 0) {
                allShops.push(...shops);
                console.log('\nFound shops:');
                shops.forEach(shop => {
                    console.log({
                        name: shop.shop_name,
                        address: `${shop.house_number} ${shop.street}`,
                        type: shop.shop_type
                    });
                });
            }
        }
        
        await fs.writeFile(
            './data/test_shops.json',
            JSON.stringify(allShops, null, 2)
        );
        
        console.log('\nTest completed! Total shops:', allShops.length);
        
    } catch (error) {
        console.error('Error during test:', error);
    }
}

console.log('Starting shop test...');
testWithSampleWards().catch(console.error); 