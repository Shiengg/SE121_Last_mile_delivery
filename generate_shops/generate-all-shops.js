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

async function findShopsInWard(ward) {
    let allShops = [];

    try {
        // Giảm số lượng search types và kết hợp các loại tìm kiếm
        const searchTypes = [
            'shop store retail',  // Tìm chung các cửa hàng
            'restaurant cafe food', // Kết hợp nhà hàng và cafe
            'supermarket convenience', // Kết hợp siêu thị và cửa hàng tiện lợi
        ];

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

            console.log(`\nRequest #${requestCount}: Searching for "${searchType}" in ${ward.name}...`);
            
            // Tăng bán kính tìm kiếm từ 3000m lên 5000m (5km)
            const url = `https://discover.search.hereapi.com/v1/discover?q=${encodeURIComponent(searchType + ' ' + ward.name)}&in=circle:10.7758,106.7018;r=10000&limit=20&apiKey=${getCurrentApiKey()}`;
            
            try {
                const response = await makeRequestWithRetry(url);
                
                if (response.data.items) {
                    const shops = response.data.items.map((item, index) => {
                        const { houseNumber, street } = parseAddress(item);
                        const shopType = getShopType(item.title, item.categories);
                        
                        // Chỉ lấy những shop có type hợp lệ
                        if (!shopType) return null;

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
                            shop_type: shopType,
                            categories: item.categories || []
                        };
                    }).filter(shop => shop !== null); // Lọc bỏ các shop không hợp lệ
                    
                    if (shops.length > 0) {
                        console.log(`Found ${shops.length} shops for ${searchType} in ${ward.name}`);
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
        
        // Lọc trùng dựa trên vị trí và tên
        const uniqueShops = allShops.filter((shop, index, self) =>
            index === self.findIndex((s) => (
                s.latitude === shop.latitude && 
                s.longitude === shop.longitude &&
                s.shop_name === shop.shop_name
            ))
        );
        
        console.log(`\nFound ${uniqueShops.length} unique shops in ${ward.name}:`);
        const typeCount = {};
        uniqueShops.forEach(shop => {
            typeCount[shop.shop_type] = (typeCount[shop.shop_type] || 0) + 1;
        });
        console.log('Shops by type:', typeCount);
        
        // Trả về tất cả shops tìm được (tối đa 20)
        return uniqueShops.slice(0, 20);
            
    } catch (error) {
        if (error.message === 'RATE_LIMIT_REACHED' || 
            error.message === 'DAILY_LIMIT_REACHED') {
            throw error;
        }
        console.error(`Error searching shops in ${ward.name}:`, error.message);
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
        console.log('Reading wards data...');
        const rawData = JSON.parse(
            await fs.readFile('./generate_shops/data/data_ward_Hochiminh.json', 'utf8')
        );
        const wardsData = rawData.Sheet1;
        
        const startIndex = await loadProgress();
        console.log(`\n📍 Resuming from ward index: ${startIndex}`);
        
        const allShops = [];
        let processedCount = startIndex;
        const totalWards = wardsData.length;
        
        console.log(`\n🚀 Starting to process remaining ${totalWards - startIndex} wards...`);

        for (let i = startIndex; i < wardsData.length; i++) {
            const ward = wardsData[i];
            console.log(`\n📌 Processing ward ${i + 1}/${totalWards}: ${ward.name}`);
            
            try {
                const shopsInWard = await findShopsInWard(ward);
                if (shopsInWard.length > 0) {
                    allShops.push(...shopsInWard);
                    console.log(`✅ Found ${shopsInWard.length} shops in ${ward.name}`);
                }
                
                processedCount = i + 1;
                await saveProgress(processedCount);
                
            } catch (error) {
                if (error.message === 'RATE_LIMIT_REACHED') {
                    console.log('\n⏸️  Process paused due to rate limit');
                    console.log(`Last processed ward: ${ward.name} (index: ${i})`);
                    console.log('You can resume later by running the script again\n');
                    
                    // Lưu shops đã tìm được trước khi dừng
                    await saveShops(allShops);
                    return;
                }
                throw error;
            }
        }

        await saveShops(allShops);
        console.log('\n✨ Completed!');
        console.log(`📊 Total wards processed: ${processedCount}`);
        console.log(`🏪 Total shops found: ${allShops.length}`);

    } catch (error) {
        console.error('Error processing wards:', error);
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

// Chạy script
console.log('Starting shop generation for all wards...');
processAllWards().catch(console.error); 