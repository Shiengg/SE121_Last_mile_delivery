import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Shared/Header';
import { toast } from 'react-hot-toast';
import { FiMapPin, FiTruck, FiClock, FiPackage } from 'react-icons/fi';

const DeliveryDashboard = () => {
  const [assignedRoutes, setAssignedRoutes] = useState([]);
  const [pendingRoutes, setPendingRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchRoutes();
    }
  }, [userInfo]);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUserInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      toast.error('Failed to load user information');
    }
  };

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/routes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Phân loại routes
        const assigned = response.data.data.filter(route => 
          route.delivery_staff_id?._id === userInfo._id
        );
        const pending = response.data.data.filter(route => 
          route.status === 'pending'
        );

        setAssignedRoutes(assigned);
        setPendingRoutes(pending);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRoute = async (routeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/routes/claim',
        { route_id: routeId },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data.success) {
        toast.success('Route claimed successfully');
        fetchRoutes(); // Refresh routes
      }
    } catch (error) {
      console.error('Error claiming route:', error);
      toast.error(error.response?.data?.message || 'Failed to claim route');
    }
  };

  const RouteCard = ({ route, type }) => {
    const getStatusBadgeClass = (status) => {
      const classes = {
        pending: 'bg-yellow-100 text-yellow-800',
        assigned: 'bg-blue-100 text-blue-800',
        delivering: 'bg-green-100 text-green-800',
        delivered: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-red-100 text-red-800',
        failed: 'bg-red-100 text-red-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    };

    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{route.route_code}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(route.status)}`}>
              {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
            </span>
          </div>
          {type === 'pending' && (
            <button
              onClick={() => handleClaimRoute(route._id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Claim Route
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-gray-600">
            <FiTruck className="mr-2" />
            <span>Vehicle Type: {route.vehicle_type}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <FiMapPin className="mr-2" />
            <span>Total Distance: {route.distance.toFixed(2)} km</span>
          </div>

          <div className="text-gray-600">
            <div className="flex items-center mb-2">
              <FiPackage className="mr-2" />
              <span>Shops ({route.shops.length}):</span>
            </div>
            <div className="ml-6 space-y-1">
              {route.shops.map((shop, index) => (
                <div key={shop.shop_id} className="text-sm">
                  {index + 1}. {shop.shop_name}
                  {index < route.shops.length - 1 && (
                    <span className="text-xs text-gray-400 ml-2">
                      ({route.section_distances?.[index]?.toFixed(2) || '?'} km)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {route.assigned_at && (
            <div className="flex items-center text-gray-600 text-sm">
              <FiClock className="mr-2" />
              <span>Assigned: {new Date(route.assigned_at).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Delivery Dashboard" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Delivery Dashboard" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Thông tin người giao hàng */}
        {userInfo && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Staff Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-gray-600">Name: {userInfo.fullName || userInfo.username}</p>
                <p className="text-gray-600">Email: {userInfo.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600">Phone: {userInfo.phone || 'N/A'}</p>
                <p className={`font-medium ${userInfo.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {userInfo.status.charAt(0).toUpperCase() + userInfo.status.slice(1)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid layout cho 2 cột routes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Routes Column */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-xl font-semibold text-blue-600 mb-4">
                Your Assigned Routes ({assignedRoutes.length})
              </h2>
              <div className="space-y-4">
                {assignedRoutes.length > 0 ? (
                  assignedRoutes.map(route => (
                    <RouteCard key={route._id} route={route} type="assigned" />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No routes assigned to you yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Available Routes Column */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-xl font-semibold text-yellow-600 mb-4">
                Available Routes ({pendingRoutes.length})
              </h2>
              <div className="space-y-4">
                {pendingRoutes.length > 0 ? (
                  pendingRoutes.map(route => (
                    <RouteCard key={route._id} route={route} type="pending" />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No available routes at the moment
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
