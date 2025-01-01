import React, { useState, useEffect } from 'react';
import Header from '../components/Shared/Header';
import authService from '../services/authService';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    username: '',
    avatar: 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('Stored token:', token);
      console.log('Stored user:', user);

      if (!token || !user) {
        toast.error('Please login again');
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Profile response:', response.data);

      if (response.data.success) {
        const userData = response.data.data;
        setUserInfo({
          ...userData,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || userData.username)}&background=0D8ABC&color=fff`
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/users/profile',
        {
          fullName: userInfo.fullName,
          email: userInfo.email,
          phone: userInfo.phone
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully');
        // Update avatar with new name
        setUserInfo(prev => ({
          ...prev,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.fullName || userInfo.username)}&background=0D8ABC&color=fff`
        }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Thông Tin Cá Nhân" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white shadow rounded-lg">
            <div className="animate-pulse">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex items-center space-x-5">
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-full bg-gray-200"></div>
                  </div>
                  <div>
                    <div className="h-6 w-40 bg-gray-200 rounded"></div>
                    <div className="mt-1 h-4 w-60 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item}>
                      <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header title="Thông Tin Cá Nhân" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
          {/* Profile Header */}
          <div className="px-6 py-8 sm:px-8 bg-gradient-to-r from-blue-500 to-blue-600 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex-shrink-0 relative group">
                <img
                  className="h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-white p-1 transition-transform duration-300 group-hover:scale-105"
                  src={userInfo.avatar}
                  alt="Profile"
                />
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Thay đổi
                  </span>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl leading-6 font-bold text-white">
                  {userInfo.fullName || userInfo.username}
                </h3>
                <p className="mt-2 text-blue-100">
                  {userInfo.role === 'Admin' ? '🌟 Quản trị viên' : '👤 Người dùng'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-8 sm:p-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm transition-all duration-300"
                      value={userInfo.username}
                      disabled
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔒
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                    value={userInfo.fullName}
                    onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })}
                    placeholder="Nhập họ và tên của bạn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vai trò
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm transition-all duration-300"
                      value={userInfo.role === 'Admin' ? 'Quản trị viên' : 'Người dùng'}
                      disabled
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {userInfo.role === 'Admin' ? '🌟' : '👤'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    placeholder="Nhập số điện thoại của bạn"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center items-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <span>Lưu thay đổi</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile; 