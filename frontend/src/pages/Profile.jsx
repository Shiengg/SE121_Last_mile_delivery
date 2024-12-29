import React, { useState, useEffect } from 'react';
import Header from '../components/Shared/Header';
import authService from '../services/authService';

const Profile = () => {
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    joinDate: '',
    avatar: 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'
  });

  useEffect(() => {
    // TODO: Fetch user info from API
    const role = authService.getCurrentUserRole();
    setUserInfo(prev => ({
      ...prev,
      role: role
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Thông Tin Cá Nhân" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg">
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
                  Họ và tên
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
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
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 