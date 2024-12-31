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
    <div className="min-h-screen bg-gray-50">
      <Header title="Thông Tin Cá Nhân" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
          {/* Profile Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center space-x-5">
              <div className="flex-shrink-0">
                <img
                  className="h-20 w-20 rounded-full ring-4 ring-blue-500 p-1"
                  src={userInfo.avatar}
                  alt="Profile"
                />
              </div>
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Thông tin cá nhân
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Quản lý thông tin cá nhân của bạn
                </p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                  value={userInfo.username}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Họ và tên
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={userInfo.fullName}
                  onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vai trò
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                  value={userInfo.role}
                  disabled
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile; 