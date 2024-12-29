const axios = require('axios');
require('dotenv').config();

async function testHEREAPI() {
    const HERE_API_KEY = process.env.HERE_API_KEY;
    
    // Test với một query đơn giản
    const query = "Circle K Hanoi";
    const url = `https://discover.search.hereapi.com/v1/discover?q=${encodeURIComponent(query)}&in=circle:21.0285,105.8542;r=5000&limit=5&apiKey=${HERE_API_KEY}`;

    try {
        console.log('Testing query:', query);
        const response = await axios.get(url);
        
        if (response.data.items && response.data.items.length > 0) {
            console.log('\nFound locations:');
            response.data.items.forEach(item => {
                console.log({
                    name: item.title,
                    address: item.address.label,
                    coordinates: item.position
                });
            });
        } else {
            console.log('No results found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testHEREAPI(); 