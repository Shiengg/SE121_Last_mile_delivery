import axios from 'axios';

class AuthService {
  login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

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
      if (error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.request) {
        throw new Error('No response from server. Please try again later.');
      } else {
        throw new Error('Error setting up request. Please try again.');
      }
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

  register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
}

export default new AuthService();
