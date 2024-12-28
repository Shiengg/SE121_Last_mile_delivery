const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('Đang test đăng nhập...');
        
        // Log request data để kiểm tra
        const requestData = {
            username: "admin",  // Thay bằng username thật từ database
            password: "123123123"  // Thay bằng password thật từ database
        };
        console.log('Sending login request with:', requestData);

        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', requestData);
        
        console.log('Đăng nhập thành công!');
        console.log('Response:', loginResponse.data);
        
    } catch (error) {
        console.error('Lỗi:', error.response ? error.response.data : error.message);
        
        // Log thêm thông tin debug
        if (error.response) {
            console.log('Error status:', error.response.status);
            console.log('Error headers:', error.response.headers);
        }
    }
};

testLogin(); 