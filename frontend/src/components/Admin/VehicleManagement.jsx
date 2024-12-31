import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const VehicleManagement = () => {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/vehicles', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setVehicleTypes(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching vehicle types');
      setLoading(false);
      toast.error('Failed to load vehicle types');
      console.error('Error:', err);
    }
  };

  const filteredVehicles = vehicleTypes.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle type?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/vehicles/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Vehicle type deleted successfully');
        fetchVehicleTypes();
      } catch (error) {
        toast.error('Failed to delete vehicle type');
        console.error('Delete error:', error);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Vehicle Type Management</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-gray-600">Total vehicles: {vehicleTypes.length}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search vehicles..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Add Button */}
            <button
              onClick={() => {
                setSelectedVehicle(null);
                setShowAddModal(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <FiPlus className="mr-2" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading vehicles...</p>
          </div>
        </div>
      ) : error ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-red-700 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchVehicleTypes}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        /* Vehicle Types Table */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th scope="col" className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th scope="col" className="hidden md:table-cell px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-gray-100 p-3 mb-4">
                          <FiSearch className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-600 mb-1">No vehicles found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle, index) => (
                    <tr 
                      key={vehicle._id}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 px-2 py-1 bg-blue-50 rounded">{vehicle.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">{vehicle.name}</span>
                          <span className="text-xs text-gray-500 md:hidden">{vehicle.description}</span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {vehicle.description || 'No description available'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${vehicle.status === 'active' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                            ${vehicle.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`
                          }></span>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="group relative p-1.5 rounded-lg hover:bg-indigo-50 transition-all duration-200"
                            title="Edit"
                          >
                            <FiEdit2 className="h-4 w-4 text-indigo-600" />
                            <span className="absolute hidden group-hover:block -top-8 -left-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md">
                              Edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle._id)}
                            className="group relative p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
                            title="Delete"
                          >
                            <FiTrash2 className="h-4 w-4 text-red-600" />
                            <span className="absolute hidden group-hover:block -top-8 -left-3 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md">
                              Delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Section */}
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-900">{vehicleTypes.length}</span> entries
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-gray-500 bg-white border border-gray-300
                    hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    transition-all duration-200"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                      text-white bg-blue-600 border border-transparent
                      hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      transition-all duration-200"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                      text-gray-700 bg-white border border-gray-300
                      hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      transition-all duration-200"
                  >
                    2
                  </button>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                    text-gray-700 bg-white border border-gray-300
                    hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Component */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-2xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedVehicle ? 'Edit Vehicle Type' : 'Add New Vehicle Type'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <VehicleTypeForm
              vehicle={selectedVehicle}
              onClose={() => setShowAddModal(false)}
              onSave={() => {
                setShowAddModal(false);
                fetchVehicleTypes();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Form Component (extracted from Modal for better organization)
const VehicleTypeForm = ({ vehicle, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    code: vehicle?.code || '',
    name: vehicle?.name || '',
    description: vehicle?.description || '',
    status: vehicle?.status || 'active'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (vehicle) {
        await axios.put(`http://localhost:5000/api/vehicles/${vehicle._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Vehicle type updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/vehicles', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Vehicle type added successfully');
      }
      onSave();
    } catch (error) {
      toast.error(vehicle ? 'Failed to update vehicle type' : 'Failed to add vehicle type');
      console.error('Submit error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
          placeholder="Enter vehicle code"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Enter vehicle name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows="3"
          placeholder="Enter vehicle description"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          {vehicle ? 'Update Vehicle' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );
};

export default VehicleManagement;
