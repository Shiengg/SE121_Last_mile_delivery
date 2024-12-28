import axios from 'axios';

class AuthService {
  login = async (username, password) => {
    // Gọi API login ở đây
    // Giả lập response cho ví dụ
    const response = { role: this.getMockRole(username) };
    
    // Lưu thông tin đăng nhập
    localStorage.setItem('userRole', response.role);
    localStorage.setItem('isAuthenticated', 'true');
    
    return response.role;
  };

  logout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
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
