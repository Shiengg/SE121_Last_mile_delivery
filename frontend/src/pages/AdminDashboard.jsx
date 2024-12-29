import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Header from '../components/Shared/Header';
import Footer from '../components/Shared/Footer';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Mock data - sau này sẽ lấy từ API
  const stats = {
    shops: 25,
    routes: 15,
    vehicles: 8
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header title="Admin Dashboard" />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Shops Stats */}
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
               onClick={() => navigate('/admin-dashboard/shops')}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors duration-300">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-4xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  {stats.shops}
                </span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Shops</h3>
                <p className="text-sm text-gray-500">Total registered stores</p>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          {/* Routes Stats */}
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
               onClick={() => navigate('/admin-dashboard/routes')}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors duration-300">
                  <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <span className="text-4xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                  {stats.routes}
                </span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">Routes</h3>
                <p className="text-sm text-gray-500">Total delivery paths</p>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-indigo-400 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          {/* Vehicle Types Stats */}
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
               onClick={() => navigate('/admin-dashboard/vehicle-types')}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors duration-300">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <span className="text-4xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                  {stats.vehicles}
                </span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">Vehicles</h3>
                <p className="text-sm text-gray-500">Total vehicle types</p>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-purple-400 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="bg-white shadow-md rounded-lg mb-6 overflow-x-auto">
          <div className="flex space-x-4 sm:space-x-8 px-4 py-2">
            <button 
              onClick={() => navigate('/admin-dashboard/shops')}
              className={`px-3 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                isActivePath('/admin-dashboard/shops') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-700 hover:text-blue-600 hover:border-b-2 hover:border-blue-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Shops</span>
              </div>
            </button>

            <button 
              onClick={() => navigate('/admin-dashboard/routes')}
              className={`px-3 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                isActivePath('/admin-dashboard/routes') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-700 hover:text-blue-600 hover:border-b-2 hover:border-blue-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Route</span>
              </div>
            </button>

            <button 
              onClick={() => navigate('/admin-dashboard/vehicle-types')}
              className={`px-3 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                isActivePath('/admin-dashboard/vehicle-types') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-700 hover:text-blue-600 hover:border-b-2 hover:border-blue-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Vehicle Type</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white shadow-md rounded-lg">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;