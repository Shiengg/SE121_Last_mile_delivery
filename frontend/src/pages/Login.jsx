import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const role = await authService.login(username, password);
      console.log('Login successful, role:', role);
      
      switch(role) {
        case 'Admin':
          navigate('/admin-dashboard');
          break;
        case 'DeliveryStaff':
          navigate('/delivery-dashboard');
          break;
        case 'Customer':
          navigate('/customer-tracking');
          break;
        default:
          setError('Invalid role received');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
