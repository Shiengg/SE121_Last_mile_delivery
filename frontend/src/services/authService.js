import axios from 'axios';

const login = async (username, password) => {
  const response = await axios.post('/api/auth/login', { username, password });
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('role', response.data.role);
  return response.data.role;
};

export default { login };
