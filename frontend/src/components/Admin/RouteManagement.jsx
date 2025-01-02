import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [editForm, setEditForm] = useState({
    vehicle_type_id: '',
    status: ''
  });
  const [vehicleTypes, setVehicleTypes] = useState([]);

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    const fetchVehicleTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/vehicles', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                // Lọc chỉ lấy các vehicle type có status là active
                const activeVehicleTypes = response.data.data.filter(type => type.status === 'active');
                setVehicleTypes(activeVehicleTypes);
            }
        } catch (error) {
            console.error('Error fetching vehicle types:', error);
            toast.error('Failed to load vehicle types');
        }
    };

    fetchVehicleTypes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching routes with token:', token);
      
      const response = await axios.get('http://localhost:5000/api/routes', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Routes response:', response.data);

      if (response.data.success) {
        setRoutes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      console.error('Error details:', error.response?.data);
      
      toast.error(
        error.response?.data?.message || 
        'Failed to load routes'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'delivering':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id, routeCode) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to delete route ${routeCode}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/routes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setRoutes(prevRoutes => prevRoutes.filter(route => route._id !== id));

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `Route ${routeCode} has been deleted.`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to delete route';
      
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
    }
  };

  const handleEdit = (route) => {
    setSelectedRoute(route);
    setEditForm({
        vehicle_type_id: route.vehicle_type_id,
        status: route.status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
        const isVehicleTypeEditable = !['assigned', 'delivering', 'delivered', 'cancelled', 'failed'].includes(selectedRoute.status);
        if (isVehicleTypeEditable && editForm.vehicle_type_id === '') {
            toast.error('Please select a vehicle type');
            return;
        }

        const payload = {
            status: editForm.status,
            vehicle_type_id: isVehicleTypeEditable ? editForm.vehicle_type_id : selectedRoute.vehicle_type_id
        };

        console.log('Submitting edit form:', payload);

        const token = localStorage.getItem('token');
        const response = await axios.put(
            `http://localhost:5000/api/routes/${selectedRoute._id}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.data.success) {
            await fetchRoutes();

            setShowEditModal(false);
            setSelectedRoute(null);
            
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Route updated successfully',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('Error updating route:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.response?.data?.message || 'Failed to update route'
        });
    }
  };

  const EditModal = () => {
    // Định nghĩa các trạng thái có thể chuyển đổi
    const getAllowedStatuses = (currentStatus) => {
        const transitions = {
            'pending': ['assigned', 'cancelled'],
            'assigned': ['delivering', 'cancelled'],
            'delivering': ['delivered', 'failed'],
            'delivered': [],
            'cancelled': [],
            'failed': ['pending']
        };
        return transitions[currentStatus] || [];
    };

    const allowedStatuses = getAllowedStatuses(selectedRoute.status);

    // Kiểm tra xem có cho phép edit vehicle type không
    const isVehicleTypeEditable = (status) => {
        const nonEditableStatuses = [
            'assigned', 'delivering', 'delivered', 
            'cancelled', 'failed'
        ];
        return !nonEditableStatuses.includes(status);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Edit Route</h3>
                    <button onClick={() => setShowEditModal(false)}>
                        <FiX className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleEditSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                        <select
                            value={editForm.vehicle_type_id}
                            onChange={(e) => setEditForm({...editForm, vehicle_type_id: e.target.value})}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${
                                !isVehicleTypeEditable(selectedRoute.status) ? 'bg-gray-100' : ''
                            }`}
                            disabled={!isVehicleTypeEditable(selectedRoute.status)}
                            required
                        >
                            <option value="" disabled>Select Vehicle Type</option>
                            {vehicleTypes.map((type) => (
                                <option key={type.code} value={type.code}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        {vehicleTypes.length === 0 && (
                            <p className="mt-1 text-sm text-yellow-600">
                                No active vehicle types available
                            </p>
                        )}
                        {!isVehicleTypeEditable(selectedRoute.status) && (
                            <p className="mt-1 text-sm text-gray-500">
                                Vehicle type cannot be changed in {selectedRoute.status} status
                            </p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        >
                            <option value={selectedRoute.status}>
                                {selectedRoute.status.charAt(0).toUpperCase() + selectedRoute.status.slice(1)}
                            </option>
                            {allowedStatuses.map((status) => (
                                status !== selectedRoute.status && (
                                    <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                )
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
  };

  // Thêm hàm kiểm tra xem route có thể xóa không
  const isDeletable = (status) => {
    const nonDeletableStatuses = ['assigned', 'delivering', 'delivered'];
    return !nonDeletableStatuses.includes(status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Route Management</h2>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
              <span className="text-sm text-gray-600">
                Pending: {routes.filter(route => route.status === 'pending').length}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></span>
              <span className="text-sm text-gray-600">
                Assigned: {routes.filter(route => route.status === 'assigned').length}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
              <span className="text-sm text-gray-600">
                Delivering: {routes.filter(route => route.status === 'delivering').length}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
              <span className="text-sm text-gray-600">
                Delivered: {routes.filter(route => route.status === 'delivered').length}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
              <span className="text-sm text-gray-600">
                Cancelled: {routes.filter(route => route.status === 'cancelled').length}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-gray-500 mr-1.5"></span>
              <span className="text-sm text-gray-600">
                Failed: {routes.filter(route => route.status === 'failed').length}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiPlus className="mr-2" />
            Add New Route
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shops
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance (km)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {route.route_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {route.shops.map((shop, index) => (
                      <div key={shop.shop_id}>
                        {index + 1}. {shop.shop_id} - {shop.shop_name}
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.vehicle_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.distance.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(route.status)}`}>
                      {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(route)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <FiEdit2 className="inline" />
                    </button>
                    <button 
                      onClick={() => isDeletable(route.status) && handleDelete(route._id, route.route_code)}
                      className={`transition-colors duration-200 ${
                        isDeletable(route.status)
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!isDeletable(route.status)}
                      title={
                        !isDeletable(route.status)
                          ? `Cannot delete route in ${route.status} status`
                          : 'Delete route'
                      }
                    >
                      <FiTrash2 className="inline w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showEditModal && <EditModal />}
    </div>
  );
};

export default RouteManagement;
