const axios = require('axios');
const fs = require('fs').promises;
const crypto = require('crypto');
require('dotenv').config();

// Thêm biến đếm request và giới hạn
let requestCount = 0;
const MAX_REQUESTS = 1000;

function generateObjectId() {
    return crypto.randomBytes(12).toString('hex');
}

function generateShopId(wardCode, index) {
    return `${wardCode}${String(index).padStart(3, '0')}`;
}

// Danh sách mở rộng các chuỗi cửa hàng theo ngành hàng
const POPULAR_CHAINS = {
    convenience: [
        'Circle K',
        'Vinmart+',
        'Bach Hoa Xanh',
        'Ministop',
        'GS25',
        'Family Mart',
        'Co.op Food',
        'Co.op Smile',
        '7-Eleven'
    ],
    supermarket: [
        'VinMart',
        'Co.opmart',
        'Mega Market',
        'AEON',
        'Lotte Mart',
        'MM Mega Market',
        'Big C',
        'Lan Chi'
    ],
    restaurant: [
        'KFC',
        'McDonald',
        'Jollibee',
        'Pizza Hut',
        'Domino Pizza',
        'Lotteria',
        'Highland Coffee',
        'Starbucks',
        'Phuc Long',
        'The Coffee House'
    ],
    pharmacy: [
        'Pharmacity',
        'Long Chau',
        'An Khang',
        'Phano',
        'Medicare',
        'Guardian'
    ],
    electronics: [
        'FPT Shop',
        'The Gioi Di Dong',
        'Dien May Xanh',
        'CellphoneS',
        'Vien Thong A',
        'Nguyen Kim'
    ],
    fashion: [
        'Uniqlo',
        'H&M',
        'Zara',
        'Canifa',
        'Routine',
        'NEM'
    ],
    beauty: [
        'Guardian',
        'Watson',
        'The Face Shop',
        'Innisfree',
        'Olive Young'
    ]
};

function getShopType(title, categories) {
    title = title.toLowerCase();
    
    // Kiểm tra từng danh mục
    for (const [type, chains] of Object.entries(POPULAR_CHAINS)) {
        if (chains.some(chain => title.includes(chain.toLowerCase()))) {
            return type;
        }
    }

    // Kiểm tra thêm từ categories nếu có
    if (categories && Array.isArray(categories)) {
        const categoryStr = categories.join(' ').toLowerCase();
        if (categoryStr.includes('convenience') || categoryStr.includes('mini mart')) return 'convenience';
        if (categoryStr.includes('supermarket')) return 'supermarket';
        if (categoryStr.includes('pharmacy') || categoryStr.includes('drugstore')) return 'pharmacy';
        if (categoryStr.includes('restaurant') || categoryStr.includes('food')) return 'restaurant';
        if (categoryStr.includes('cafe') || categoryStr.includes('coffee')) return 'cafe';
        if (categoryStr.includes('fashion') || categoryStr.includes('clothing')) return 'fashion';
        if (categoryStr.includes('electronics')) return 'electronics';
        if (categoryStr.includes('book')) return 'books';
        if (categoryStr.includes('beauty') || categoryStr.includes('cosmetics')) return 'beauty';
        if (categoryStr.includes('sports')) return 'sports';
    }

    return 'retail';
}

function parseAddress(item) {
    try {
        const fullAddress = item.address.label;
        const parts = fullAddress.split(',').map(part => part.trim());
        const streetPart = parts[0];
        let houseNumber = '';
        let street = streetPart;

        const match = streetPart.match(/^(\d+[A-Za-z]?)\s+(.+)/);
        if (match) {
            houseNumber = match[1];
            street = match[2];
        }

        if (!houseNumber && item.address.houseNumber) {
            houseNumber = item.address.houseNumber;
        }

        if (item.address.street) {
            street = item.address.street;
        }

        return { houseNumber, street };
    } catch (error) {
        console.error('Error parsing address:', error);
        return { houseNumber: '', street: '' };
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequestWithRetry(url, retries = 1) {
    try {
        const response = await axios.get(url);
        return response;
    } catch (error) {
        if (error.response?.status === 429) {
            console.log('\n⚠️ Rate limit reached. Please try again later.');
            // Ném lỗi để dừng chương trình
            throw new Error('RATE_LIMIT_REACHED');
        }
        throw error;
    }
}

// Thêm mảng API keys
const HERE_API_KEYS = [
    process.env.HERE_API_KEY_1,
    process.env.HERE_API_KEY_2
];
let currentApiKeyIndex = 0;

// Thêm function để lấy và chuyển API key
function getCurrentApiKey() {
    return HERE_API_KEYS[currentApiKeyIndex];
}

function switchToNextApiKey() {
    currentApiKeyIndex++;
    if (currentApiKeyIndex < HERE_API_KEYS.length) {
        console.log(`\n🔄 Switching to API Key #${currentApiKeyIndex + 1}`);
        return true;
    }
    return false;
}

// Thêm tọa độ trung tâm cho các quận/phường chính
const DISTRICT_COORDINATES = {
    // Quận trung tâm
    '760': { // Quận 1
        center: { lat: 10.7757, lng: 106.7004 },
        radius: 3000
    },
    '770': { // Quận 3
        center: { lat: 10.7841, lng: 106.6825 },
        radius: 2500
    },
    '773': { // Quận 4
        center: { lat: 10.7578, lng: 106.7052 },
        radius: 3000
    },
    '774': { // Quận 5
        center: { lat: 10.7539, lng: 106.6633 },
        radius: 3000
    },
    '775': { // Quận 6
        center: { lat: 10.7459, lng: 106.6352 },
        radius: 3500
    },
    '778': { // Quận 7
        center: { lat: 10.7342, lng: 106.7218 },
        radius: 5000
    },
    '776': { // Quận 8
        center: { lat: 10.7224, lng: 106.6283 },
        radius: 4000
    },
    '771': { // Quận 10
        center: { lat: 10.7729, lng: 106.6618 },
        radius: 3000
    },
    '772': { // Quận 11
        center: { lat: 10.7629, lng: 106.6505 },
        radius: 3000
    },
    '761': { // Quận 12
        center: { lat: 10.8671, lng: 106.6413 },
        radius: 6000
    },

    // Các quận lớn
    '769': { // TP Thủ Đức
        center: { lat: 10.8514, lng: 106.7714 },
        radius: 8000
    },
    '764': { // Quận Gò Vấp
        center: { lat: 10.8437, lng: 106.6585 },
        radius: 4500
    },
    '765': { // Quận Bình Thạnh
        center: { lat: 10.8105, lng: 106.7091 },
        radius: 5000
    },
    '766': { // Quận Tân Bình
        center: { lat: 10.8013, lng: 106.6527 },
        radius: 4500
    },
    '767': { // Quận Tân Phú
        center: { lat: 10.7900, lng: 106.6281 },
        radius: 4500
    },
    '768': { // Quận Phú Nhuận
        center: { lat: 10.7991, lng: 106.6802 },
        radius: 3000
    },
    '777': { // Quận Bình Tân
        center: { lat: 10.7652, lng: 106.6027 },
        radius: 6000
    },

    // Các huyện ngoại thành
    '783': { // Huyện Củ Chi
        center: { lat: 11.0237, lng: 106.5130 },
        radius: 15000
    },
    '784': { // Huyện Hóc Môn
        center: { lat: 10.8865, lng: 106.5938 },
        radius: 8000
    },
    '785': { // Huyện Bình Chánh
        center: { lat: 10.6841, lng: 106.5422 },
        radius: 12000
    },
    '786': { // Huyện Nhà Bè
        center: { lat: 10.6957, lng: 106.7019 },
        radius: 8000
    },
    '787': { // Huyện Cần Giờ
        center: { lat: 10.5101, lng: 106.8686 },
        radius: 20000
    }
};

// Thêm hàm kiểm tra địa chỉ
function validateAddress(item, ward, district) {
    try {
        // Kiểm tra xem địa chỉ có chứa tên phường không
        const addressLower = item.address.label.toLowerCase();
        const wardNameLower = ward.name.toLowerCase();
        const districtNameLower = district.name.toLowerCase();

        // Kiểm tra cả tên phường và tên quận trong địa chỉ
        const hasWardName = addressLower.includes(wardNameLower);
        const hasDistrictName = addressLower.includes(districtNameLower);

        // Nếu địa chỉ không chứa cả tên phường và tên quận, return false
        if (!hasWardName || !hasDistrictName) {
            return false;
        }

        // Kiểm tra khoảng cách từ điểm này đến trung tâm quận
        const districtCoords = DISTRICT_COORDINATES[ward.district_id];
        if (!districtCoords) return false;

        const distance = calculateDistance(
            item.position.lat,
            item.position.lng,
            districtCoords.center.lat,
            districtCoords.center.lng
        );

        // Chỉ chấp nhận nếu nằm trong bán kính cho phép
        return distance <= districtCoords.radius / 1000;
    } catch (error) {
        console.error('Error validating address:', error);
        return false;
    }
}

async function findShopsInWard(ward, district) {
    let allShops = [];

    try {
        const searchTypes = [
            'shop store retail',
            'restaurant cafe food',
            'supermarket convenience',
        ];

        const districtCoords = DISTRICT_COORDINATES[ward.district_id];
        if (!districtCoords) {
            console.log(`⚠️ Warning: No coordinates found for district ${ward.district_id}`);
            return [];
        }

        for (const searchType of searchTypes) {
            requestCount++;
            if (requestCount >= MAX_REQUESTS) {
                if (switchToNextApiKey()) {
                    requestCount = 0;
                    console.log('Continuing with new API key...');
                } else {
                    throw new Error('DAILY_LIMIT_REACHED');
                }
            }

            console.log(`\nRequest #${requestCount}: Searching for "${searchType}" in ${ward.full_location}...`);
            
            // Thêm tên phường vào query tìm kiếm
            const searchQuery = `${searchType} ${ward.name} ${district.name}`;
            const url = `https://discover.search.hereapi.com/v1/discover?q=${encodeURIComponent(searchQuery)}&in=circle:${districtCoords.center.lat},${districtCoords.center.lng};r=${districtCoords.radius}&limit=20&apiKey=${getCurrentApiKey()}`;
            
            try {
                const response = await makeRequestWithRetry(url);
                
                if (response.data.items) {
                    const shops = response.data.items
                        .filter(item => validateAddress(item, ward, district))
                        .map((item, index) => {
                            const { houseNumber, street } = parseAddress(item);
                            const shopType = getShopType(item.title, item.categories);
                            
                            if (!shopType) return null;

                            return {
                                _id: generateObjectId(),
                                shop_id: generateShopId(ward.code, index + 1),
                                shop_name: item.title,
                                country_id: "VN",
                                province_id: "79",
                                district_id: ward.district_id,
                                ward_code: ward.code,
                                house_number: houseNumber,
                                street: street,
                                full_address: item.address.label,
                                latitude: item.position.lat,
                                longitude: item.position.lng,
                                shop_type: shopType,
                                categories: item.categories || []
                            };
                        }).filter(shop => shop !== null);
                    
                    if (shops.length > 0) {
                        console.log(`Found ${shops.length} valid shops for ${searchType} in ${ward.full_location}`);
                        allShops.push(...shops);
                    }
                }
            } catch (error) {
                if (error.response?.status === 429) {
                    if (switchToNextApiKey()) {
                        requestCount = 0;
                        console.log('Retrying with new API key...');
                        continue;
                    }
                    throw new Error('RATE_LIMIT_REACHED');
                }
                console.error(`Error searching for ${searchType}:`, error.message);
            }
            
            await sleep(2000);
        }

        return allShops;
    } catch (error) {
        if (error.message === 'RATE_LIMIT_REACHED' || 
            error.message === 'DAILY_LIMIT_REACHED') {
            throw error;
        }
        console.error(`Error searching shops in ${ward.full_location}:`, error.message);
        return [];
    }
}

async function saveProgress(processedWards) {
    await fs.writeFile(
        './generate_shops/data/progress.json',
        JSON.stringify({
            lastProcessedIndex: processedWards,
            timestamp: new Date().toISOString()
        })
    );
}

async function loadProgress() {
    try {
        // Tạm thời return 0 để bắt đầu từ đầu
        return 0;
        
        // Hoặc uncomment đoạn code này sau khi đã test thành công
        /*
        const progress = JSON.parse(
            await fs.readFile('./generate_shops/data/progress.json', 'utf8')
        );
        return progress.lastProcessedIndex;
        */
    } catch (error) {
        return 0;
    }
}

async function processAllWards() {
    try {
        console.log('Reading districts and wards data...');
        const wardsData = JSON.parse(
            await fs.readFile('./generate_shops/data/data_ward_Hochiminh.json', 'utf8')
        ).Sheet1;
        
        const districtsData = JSON.parse(
            await fs.readFile('./generate_shops/data/data_district_Hochiminh.json', 'utf8')
        ).Sheet1;

        const districtsMap = new Map(
            districtsData.map(district => [district.code, district])
        );
        
        const startIndex = await loadProgress();
        console.log(`\n📍 Resuming from ward index: ${startIndex}`);
        
        const allShops = [];
        let processedCount = startIndex;
        const totalWards = wardsData.length;
        
        console.log(`\n🚀 Starting to process remaining ${totalWards - startIndex} wards...`);

        for (let i = startIndex; i < wardsData.length; i++) {
            const ward = wardsData[i];
            const district = districtsMap.get(ward.district_id);
            
            if (!district) {
                console.log(`⚠️ Warning: District not found for ward ${ward.name}`);
                continue;
            }

            const searchLocation = `${ward.name}, ${district.name}, Ho Chi Minh City`;
            console.log(`\n📌 Processing: ${searchLocation}`);
            
            try {
                const shopsInWard = await findShopsInWard(
                    { ...ward, full_location: searchLocation },
                    district
                );

                if (shopsInWard.length > 0) {
                    allShops.push(...shopsInWard);
                    console.log(`✅ Found ${shopsInWard.length} shops in ${searchLocation}`);
                }
                
                processedCount = i + 1;
                await saveProgress(processedCount);
                
            } catch (error) {
                if (error.message === 'RATE_LIMIT_REACHED') {
                    console.log('\n⏸️  Process paused due to rate limit');
                    console.log(`Last processed location: ${searchLocation} (index: ${i})`);
                    console.log('You can resume later by running the script again\n');
                    
                    await saveShops(allShops);
                    return;
                }
                throw error;
            }
        }

        await saveShops(allShops);
        console.log('\n✨ Completed!');
        console.log(`📊 Total locations processed: ${processedCount}`);
        console.log(`🏪 Total shops found: ${allShops.length}`);

    } catch (error) {
        console.error('Error processing locations:', error);
    }
}

async function saveShops(newShops) {
    const outputPath = './generate_shops/data/shops.json';
    let existingShops = [];
    try {
        existingShops = JSON.parse(await fs.readFile(outputPath, 'utf8'));
    } catch (error) {
        // File không tồn tại hoặc rỗng
    }

    const allUniqueShops = [...existingShops, ...newShops];
    await fs.writeFile(
        outputPath,
        JSON.stringify(allUniqueShops, null, 2)
    );
}

// Thêm hàm kiểm tra vị trí có nằm trong phường không
function isLocationInWard(position, wardName, districtId) {
    // Lấy tọa độ trung tâm của quận
    const districtCoords = DISTRICT_COORDINATES[districtId];
    if (!districtCoords) return false;

    // Tính khoảng cách từ điểm đến trung tâm quận
    const distance = calculateDistance(
        position.lat,
        position.lng,
        districtCoords.center.lat,
        districtCoords.center.lng
    );

    // Kiểm tra xem có nằm trong bán kính cho phép không
    return distance <= districtCoords.radius / 1000; // Convert meters to kilometers
}

// Hàm tính khoảng cách giữa 2 điểm (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Chạy script
console.log('Starting shop generation for all wards...');
processAllWards().catch(console.error); 