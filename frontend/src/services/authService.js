import axios from 'axios';

const login = async (username, password) => {
  try {
    const response = await axios.post('/api/auth/login', { username, password });
    
    // Lưu token và role vào localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('role', response.data.role);
    
    // Thêm token vào header mặc định cho các request sau này
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    
    return response.data.role;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  delete axios.defaults.headers.common['Authorization'];
};

export default { login, logout };
