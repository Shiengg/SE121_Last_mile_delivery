import axios from 'axios';

class AuthService {
  login = async (username, password) => {
    try {
      console.log('Attempting login with:', { username }); // Debug log
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

      console.log('Login response:', response.data); // Debug log

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('isAuthenticated', 'true');
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return user.role;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  isAuthenticated = () => {
    return localStorage.getItem('isAuthenticated') === 'true';
  };

  getCurrentUserRole = () => {
    return localStorage.getItem('userRole');
  };

  getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };
}

export default new AuthService();
