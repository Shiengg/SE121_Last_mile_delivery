import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';

const Header = ({ title }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    role: '',
    displayRole: ''
  });

  useEffect(() => {
    const role = authService.getCurrentUserRole();
    // Định dạng tên hiển thị và role dựa theo role của user
    const userDisplayInfo = {
      Admin: {
        name: 'Admin User',
        displayRole: 'System Administrator'
      },
      DeliveryStaff: {
        name: 'Delivery Staff',
        displayRole: 'Delivery staff'
      },
      Customer: {
        name: 'Customer',
        displayRole: 'Customer'
      }
    };

    setUserInfo({
      name: userDisplayInfo[role]?.name || 'User',
      role: role,
      displayRole: userDisplayInfo[role]?.displayRole || 'User'
    });
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login'; // hoặc sử dụng navigate từ react-router
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo và Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">Last Mile Delivery Management</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* Search Bar */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-2.5">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Notification Button with Badge */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">3</span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center space-x-3 focus:outline-none"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <img
                  className="h-9 w-9 rounded-full ring-2 ring-blue-500 p-0.5"
                  src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"
                  alt="User avatar"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                  <p className="text-xs text-gray-500">{userInfo.displayRole}</p>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <a
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Thông tin cá nhân
                  </a>
                  <a
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Cài đặt
                  </a>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
