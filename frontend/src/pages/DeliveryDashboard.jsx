import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Shared/Header';
import { toast } from 'react-hot-toast';
import { FiMapPin, FiTruck, FiClock, FiPackage, FiUser, FiMail, FiPhone, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [assignedRoutes, setAssignedRoutes] = useState([]);
  const [pendingRoutes, setPendingRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState({ assigned: 1, pending: 1 });
  const [itemsPerPage] = useState(5);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

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

  const handleStatusChange = async (routeId, currentStatus) => {
    try {
      let newStatus;
      if (currentStatus === 'assigned') {
        newStatus = 'delivering';
      } else if (currentStatus === 'delivering') {
        // Hiển thị dialog để chọn delivered hoặc failed
        const result = await Swal.fire({
          title: 'Complete Delivery',
          text: 'Was the delivery successful?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#EF4444',
          confirmButtonText: 'Yes, Delivered',
          cancelButtonText: 'No, Failed',
          reverseButtons: true
        });

        newStatus = result.isConfirmed ? 'delivered' : 'failed';
      }

      if (newStatus) {
        const token = localStorage.getItem('token');
        const response = await axios.put(
          `http://localhost:5000/api/routes/${routeId}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` }}
        );

        if (response.data.success) {
          toast.success(`Route status updated to ${newStatus}`);
          fetchRoutes(); // Refresh routes
        }
      }
    } catch (error) {
      console.error('Error updating route status:', error);
      toast.error(error.response?.data?.message || 'Failed to update route status');
    }
  };

  const RouteCard = ({ route, type }) => {
    const getStatusBadgeClass = (status) => {
      const classes = {
        pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        assigned: 'bg-blue-100 text-blue-800 border border-blue-200',
        delivering: 'bg-green-100 text-green-800 border border-green-200',
        delivered: 'bg-gray-100 text-gray-800 border border-gray-200',
        cancelled: 'bg-red-100 text-red-800 border border-red-200',
        failed: 'bg-red-100 text-red-800 border border-red-200'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    };

    const getActionButton = (status) => {
      switch (status) {
        case 'assigned':
          return (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStatusChange(route._id, status)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg 
                hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-sm
                hover:shadow-md flex items-center space-x-2"
            >
              <span>Start Delivery</span>
              <FiTruck className="w-4 h-4" />
            </motion.button>
          );
        case 'delivering':
          return (
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStatusChange(route._id, status)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg 
                  hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-sm
                  hover:shadow-md flex items-center space-x-2"
              >
                <span>Complete Delivery</span>
                <FiCheckCircle className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/delivery/map/${route._id}`)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg 
                  hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-sm
                  hover:shadow-md flex items-center space-x-2"
              >
                <span>View Map</span>
                <FiMapPin className="w-4 h-4" />
              </motion.button>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        className={`bg-white rounded-xl shadow-sm p-6 mb-4 border-l-4 transition-all duration-300
          ${type === 'assigned' ? 'border-l-blue-500' : 'border-l-yellow-500'}
          hover:shadow-lg relative overflow-hidden group`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-30" />
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{route.route_code}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(route.status)}`}>
                  {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <FiTruck className="mr-2 text-blue-500" />
                  <span>{route.vehicle_type}</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="mr-2 text-blue-500" />
                  <span>{route.distance.toFixed(2)} km</span>
                </div>
              </div>
            </div>
            {type === 'pending' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleClaimRoute(route._id)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg 
                  hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-sm
                  hover:shadow-md flex items-center space-x-2"
              >
                <span>Claim Route</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 backdrop-blur-sm bg-opacity-80">
              <div className="flex items-center mb-3">
                <FiPackage className="text-blue-500 mr-2" />
                <span className="font-medium text-gray-700">Delivery Sequence</span>
              </div>
              <div className="space-y-3">
                {route.shops.map((shop, index) => (
                  <div key={shop.shop_id} 
                    className="flex items-start space-x-3 text-sm group/item"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium
                      group-hover/item:bg-blue-200 transition-colors duration-200">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-gray-800 group-hover/item:text-blue-600 transition-colors duration-200">
                        {shop.shop_name}
                      </div>
                      {index < route.shops.length - 1 && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <motion.svg 
                            className="w-4 h-4 mr-1 text-blue-500"
                            initial={{ y: 0 }}
                            animate={{ y: [0, 2, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </motion.svg>
                          Next Stop
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              {route.assigned_at && (
                <div className="flex items-center text-sm text-gray-600">
                  <FiClock className="mr-2 text-blue-500" />
                  <span>Assigned: {new Date(route.assigned_at).toLocaleString()}</span>
                </div>
              )}
              {type === 'assigned' && getActionButton(route.status)}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const getPaginatedRoutes = (routes, type) => {
    const indexOfLastItem = currentPage[type] * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return routes.slice(indexOfFirstItem, indexOfLastItem);
  };

  const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange, type }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center space-x-2 mt-4 pb-2">
        <button
          onClick={() => onPageChange(type, Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          Previous
        </button>
        <span className="px-3 py-1 bg-gray-50 rounded-md text-gray-600">
          {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(type, Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  const handlePageChange = (type, pageNumber) => {
    setCurrentPage(prev => ({
      ...prev,
      [type]: pageNumber
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Delivery Dashboard" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50">
      <Header title="Delivery Dashboard" />
      
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        {/* Profile Card */}
        {userInfo && (
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 hover:shadow-md transition-all duration-300"
          >
            <div className="md:flex">
              <div className="md:flex-shrink-0 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 p-6 text-white
                relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }} />
                </div>
                <div className="relative">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3"
                  >
                    <FiUser className="w-8 h-8" />
                  </motion.div>
                  <h2 className="text-xl font-semibold">Delivery Staff</h2>
                </div>
              </div>
              <div className="p-6 md:p-8 flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <FiUser className="text-blue-500" />
                      <div>
                        <label className="text-sm text-gray-500">Full Name</label>
                        <p className="font-medium text-gray-900">{userInfo.fullName || userInfo.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FiMail className="text-blue-500" />
                      <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <p className="font-medium text-gray-900">{userInfo.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <FiPhone className="text-blue-500" />
                      <div>
                        <label className="text-sm text-gray-500">Phone</label>
                        <p className="font-medium text-gray-900">{userInfo.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FiCheckCircle className="text-blue-500" />
                      <div>
                        <label className="text-sm text-gray-500">Status</label>
                        <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                          ${userInfo.status === 'active' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'}`}>
                          {userInfo.status.charAt(0).toUpperCase() + userInfo.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Routes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assigned Routes Column */}
          <div className="h-[calc(100vh-300px)] flex flex-col">
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Your Assigned Routes</h2>
                  <p className="text-sm text-gray-500 mt-1">Routes currently assigned to you</p>
                </div>
                <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">
                  {assignedRoutes.length} Routes
                </span>
              </div>
              <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                <div className="space-y-4">
                  {getPaginatedRoutes(assignedRoutes, 'assigned').length > 0 ? (
                    getPaginatedRoutes(assignedRoutes, 'assigned').map(route => (
                      <RouteCard key={route._id} route={route} type="assigned" />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiPackage className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No routes assigned to you yet</p>
                    </div>
                  )}
                </div>
              </div>
              <Pagination
                totalItems={assignedRoutes.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage.assigned}
                onPageChange={handlePageChange}
                type="assigned"
              />
            </div>
          </div>

          {/* Available Routes Column */}
          <div className="h-[calc(100vh-300px)] flex flex-col">
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Available Routes</h2>
                  <p className="text-sm text-gray-500 mt-1">Routes you can claim</p>
                </div>
                <span className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg font-medium">
                  {pendingRoutes.length} Routes
                </span>
              </div>
              <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                <div className="space-y-4">
                  {getPaginatedRoutes(pendingRoutes, 'pending').length > 0 ? (
                    getPaginatedRoutes(pendingRoutes, 'pending').map(route => (
                      <RouteCard key={route._id} route={route} type="pending" />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiPackage className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No available routes at the moment</p>
                    </div>
                  )}
                </div>
              </div>
              <Pagination
                totalItems={pendingRoutes.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage.pending}
                onPageChange={handlePageChange}
                type="pending"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeliveryDashboard;
