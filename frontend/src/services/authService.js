import axios from 'axios';

class AuthService {
  login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { token, role } = response.data;
      
      // Lưu token và role vào localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Cấu hình axios để tự động gửi token trong header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return role;
    } catch (error) {
      throw error;
    }
  };

  logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    delete axios.defaults.headers.common['Authorization'];
  };

  isAuthenticated = () => {
    return localStorage.getItem('isAuthenticated') === 'true';
  };

  getCurrentUserRole = () => {
    return localStorage.getItem('userRole');
  };

  // Hàm giả lập role cho demo
  getMockRole = (username) => {
    if (username.includes('admin')) return 'Admin';
    if (username.includes('delivery')) return 'DeliveryStaff';
    return 'Customer';
  };
}

export default new AuthService();
