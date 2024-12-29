const axios = require('axios');

const createTestUser = async () => {
    try {
        console.log('Đang tạo user test...');
        const testUser = {
            username: "customer",
            password: "123123123",
            role: "Customer"
        };
        
        console.log('Đang gửi dữ liệu đăng ký:', testUser);
        
        const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
        console.log('Đăng ký thành công:', registerResponse.data);
        
        console.log('\nĐang thử đăng nhập...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            username: testUser.username,
            password: testUser.password
        });
        
        console.log('Đăng nhập thành công:', loginResponse.data);
        
    } catch (error) {
        console.error('Lỗi:', error.response ? error.response.data : error.message);
    }
};

createTestUser(); 