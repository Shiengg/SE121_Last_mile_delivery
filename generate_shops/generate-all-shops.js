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
        'GO! Market'
    ],
    pharmacy: [
        'Pharmacity',
        'Guardian',
        'Medicare',
        'Long Chau',
        'An Khang',
        'Phano Pharmacy',
        'Eco Pharmacy',
        'Pharmacity'
    ],
    restaurant: [
        'Lotteria',
        'KFC',
        'Jollibee',
        'McDonald\'s',
        'Pizza Hut',
        'Domino\'s Pizza',
        'The Pizza Company',
        'Burger King',
        'Texas Chicken',
        'Popeyes'
    ],
    cafe: [
        'The Coffee House',
        'Highlands Coffee',
        'Phuc Long',
        'Starbucks',
        'Trung Nguyen',
        'Paris Baguette',
        'Tous Les Jours',
        'Cheese Coffee'
    ],
    fashion: [
        'Uniqlo',
        'H&M',
        'Zara',
        'Muji',
        'Canifa',
        'NEM',
        'IVY Moda',
        'Elise',
        'Vascara',
        'Juno'
    ],
    electronics: [
        'FPT Shop',
        'The Gioi Di Dong',
        'CellphoneS',
        'Viet Tel Store',
        'Nguyen Kim',
        'Dien May Xanh',
        'Pico',
        'Phong Vu'
    ],
    books: [
        'Fahasa',
        'Nha Nam',
        'Tiki Books',
        'Phuong Nam Book',
        'Thai Ha Books'
    ],
    beauty: [
        'Watson\'s',
        'The Face Shop',
        'Innisfree',
        'The Body Shop',
        'MAC Cosmetics',
        'Olive Young'
    ],
    sports: [
        'Decathlon',
        'Super Sports',
        'Nike',
        'Adidas',
        'Puma',
        'Under Armour'
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

async function makeRequestWithRetry(url, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url);
            return response;
        } catch (error) {
            if (error.response?.status === 429) {
                console.log(`Rate limit hit, waiting ${delay/1000}s before retry ${i + 1}/${retries}...`);
                await sleep(delay);
                // Tăng thời gian chờ cho lần retry tiếp theo
                delay *= 2;
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries reached');
}

async function findShopsInWard(ward) {
    const HERE_API_KEY = process.env.HERE_API_KEY;
    const allShops = [];

    try {
        for (const [type, chains] of Object.entries(POPULAR_CHAINS)) {
            for (const chain of chains) {
                console.log(`\nSearching for "${chain}" (${type}) in ${ward.name}...`);
                
                const url = `https://discover.search.hereapi.com/v1/discover?q=${encodeURIComponent(chain + ' ' + ward.name)}&in=circle:21.0285,105.8542;r=2000&limit=3&apiKey=${HERE_API_KEY}`;
                
                try {
                    const response = await makeRequestWithRetry(url);
                    
                    if (response.data.items) {
                        const shops = response.data.items
                            .filter(item => item.title.toLowerCase().includes(chain.toLowerCase()))
                            .map((item, index) => {
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
                                    shop_type: type
                                };
                            });
                        
                        allShops.push(...shops);
                    }
                    
                    // Tăng delay giữa các request lên 3 giây
                    await sleep(3000);
                    
                } catch (error) {
                    console.error(`Error searching for ${chain} in ${ward.name}:`, error.message);
                    continue; // Tiếp tục với chain tiếp theo nếu có lỗi
                }
            }
        }
        
        // Lọc shop trùng lặp
        const uniqueShops = allShops.filter((shop, index, self) =>
            index === self.findIndex((s) => (
                s.latitude === shop.latitude && 
                s.longitude === shop.longitude
            ))
        );
        
        // Trả về tối đa 3 shop cho mỗi ward
        return uniqueShops.slice(0, 3);
            
    } catch (error) {
        console.error(`Error searching shops in ${ward.name}:`, error.message);
        return [];
    }
}

async function saveProgress(processedWards) {
    await fs.writeFile(
        './data/progress.json',
        JSON.stringify({
            lastProcessedIndex: processedWards,
            timestamp: new Date().toISOString()
        })
    );
}

async function loadProgress() {
    try {
        const progress = JSON.parse(
            await fs.readFile('./data/progress.json', 'utf8')
        );
        return progress.lastProcessedIndex;
    } catch (error) {
        return 0; // Bắt đầu từ đầu nếu không có file progress
    }
}

async function processAllWards() {
    try {
        console.log('Reading wards data...');
        const rawData = JSON.parse(
            await fs.readFile('./data/data_ward_Hanoi.json', 'utf8')
        );
        const wardsData = rawData.Sheet1;
        
        // Load tiến trình từ lần chạy trước
        const startIndex = await loadProgress();
        console.log(`Resuming from ward index: ${startIndex}`);
        
        const allShops = [];
        let processedCount = startIndex;
        const totalWards = wardsData.length;
        
        console.log(`Starting to process remaining ${totalWards - startIndex} wards...`);

        // Bắt đầu từ vị trí đã lưu
        for (let i = startIndex; i < wardsData.length; i++) {
            const ward = wardsData[i];
            console.log(`\nProcessing ward ${i + 1}/${totalWards}: ${ward.name}`);
            
            const shopsInWard = await findShopsInWard(ward);
            if (shopsInWard.length > 0) {
                allShops.push(...shopsInWard);
                console.log(`Found ${shopsInWard.length} shops in ${ward.name}`);
            }
            
            processedCount = i + 1;
            // Lưu tiến trình sau mỗi ward
            await saveProgress(processedCount);
        }

        // Ghi kết quả vào file
        const outputPath = './data/shops.json';
        // Đọc shops đã có (nếu có)
        let existingShops = [];
        try {
            existingShops = JSON.parse(await fs.readFile(outputPath, 'utf8'));
        } catch (error) {
            // File không tồn tại hoặc rỗng
        }

        // Gộp shops mới với shops cũ
        const allUniqueShops = [...existingShops, ...allShops];
        
        await fs.writeFile(
            outputPath,
            JSON.stringify(allUniqueShops, null, 2)
        );

        console.log('\nCompleted!');
        console.log(`Total wards processed: ${processedCount}`);
        console.log(`Total shops found: ${allUniqueShops.length}`);

    } catch (error) {
        console.error('Error processing wards:', error);
    }
}

// Chạy script
console.log('Starting shop generation for all wards...');
processAllWards().catch(console.error); 