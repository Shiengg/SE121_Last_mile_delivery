import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { AdminContext } from '../../contexts/AdminContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Swal from 'sweetalert2';

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [formData, setFormData] = useState({
    shop_id: '',
    shop_name: '',
    country_id: 'VN',
    province_id: '',
    district_id: '',
    ward_code: '',
    house_number: '',
    street: '',
    latitude: '',
    longitude: '',
    shop_type: 'retail',
    categories: [],
    status: 'active'
  });
  const { fetchStats } = useContext(AdminContext);
  const { updateNotifications } = useNotifications();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(50);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);
  const [visibleShops, setVisibleShops] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      searchTimeout.current = setTimeout(() => {
        fetchShops(currentPage, searchTerm);
      }, 500);
    };

    fetchData();

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [currentPage, searchTerm]);

  useEffect(() => {
    setVisibleShops(shops);
  }, [shops]);

  const fetchShops = async (page, search = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/shops', {
        params: {
          page,
          limit: pageSize,
          search
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setShops(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching shops:', err);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      Swal.fire({
        title: 'Processing...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      if (selectedShop) {
        await axios.put(
          `http://localhost:5000/api/shops/${selectedShop._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Shop updated successfully',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await axios.post(
          'http://localhost:5000/api/shops',
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Shop added successfully',
          timer: 1500,
          showConfirmButton: false
        });
      }

      setShowAddModal(false);
      setSelectedShop(null);
      setFormData({
        shop_id: '',
        shop_name: '',
        country_id: 'VN',
        province_id: '',
        district_id: '',
        ward_code: '',
        house_number: '',
        street: '',
        latitude: '',
        longitude: '',
        shop_type: 'retail',
        categories: [],
        status: 'active'
      });
      
      await fetchShops(currentPage, searchTerm);
      await fetchStats();
      
      const activitiesResponse = await axios.get('http://localhost:5000/api/activities/recent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (activitiesResponse.data.success) {
        updateNotifications(activitiesResponse.data.data);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: selectedShop ? 'Failed to update shop' : 'Failed to add shop',
        confirmButtonText: 'OK'
      });
      console.error('Submit error:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.delete(
                        `http://localhost:5000/api/shops/${id}`,
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                    
                    if (!response.data.success) {
                        throw new Error(response.data.message);
                    }
                    return response.data;
                } catch (error) {
                    throw new Error(
                        error.response?.data?.message || 
                        error.message || 
                        'Failed to delete shop'
                    );
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });

        if (result.isConfirmed && result.value) {
            // Cập nhật UI
            setShops(prevShops => prevShops.filter(s => s._id !== id));
            
            // Cập nhật số liệu thống kê
            await fetchStats();
            
            // Lấy thông tin hoạt động mới nhất
            const token = localStorage.getItem('token');
            const activitiesResponse = await axios.get(
                'http://localhost:5000/api/activities/recent',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            if (activitiesResponse.data.success) {
                updateNotifications(activitiesResponse.data.data);
            }

            // Hiển thị thông báo thành công bằng SweetAlert2
            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Shop has been deleted successfully.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('Delete error:', error);
        
        // Hiển thị thông báo lỗi bằng SweetAlert2
        await Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.message || 'Failed to delete shop',
            confirmButtonText: 'OK'
        });
        
        // Refresh data nếu có lỗi
        await fetchShops(currentPage, searchTerm);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          {/* Add loading skeleton */}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Shop Management</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                <span className="text-sm text-gray-600">
                  Active: <span className="font-semibold text-green-600">
                    {shops.filter(shop => shop.status === 'active').length}
                  </span>
                </span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                <span className="text-sm text-gray-600">
                  Inactive: <span className="font-semibold text-red-600">
                    {shops.filter(shop => shop.status === 'inactive').length}
                  </span>
                </span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600">
                  Total: <span className="font-semibold text-gray-900">{totalItems}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search shops..."
                className="w-full sm:max-w-xs pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <button
              onClick={() => {
                setSelectedShop(null);
                setShowAddModal(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <FiPlus className="mr-2" />
              <span>Add Shop</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading shops...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-[1]">
                <tr>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop ID
                  </th>
                  <th className="w-44 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="w-72 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="w-24 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleShops.map((shop) => (
                  <tr key={shop._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap truncate">
                      <div className="text-sm font-medium text-gray-900">{shop.shop_id}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 truncate max-w-[160px]" title={shop.shop_name}>
                        {shop.shop_name}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500 truncate" title={`${shop.street}, ${shop.ward_code}, ${shop.district_id}, ${shop.province_id}`}>
                        {`${shop.street}, ${shop.ward_code}, ${shop.district_id}, ${shop.province_id}`}
                      </div>
                      <div className="text-xs text-gray-400 truncate" title={`${shop.latitude}, ${shop.longitude}`}>
                        {`${shop.latitude}, ${shop.longitude}`}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap truncate">
                      <div className="text-sm text-gray-900 capitalize">{shop.shop_type}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        shop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedShop(shop);
                          setFormData({
                            shop_id: shop.shop_id,
                            shop_name: shop.shop_name,
                            country_id: shop.country_id,
                            province_id: shop.province_id,
                            district_id: shop.district_id,
                            ward_code: shop.ward_code,
                            house_number: shop.house_number,
                            street: shop.street,
                            latitude: shop.latitude,
                            longitude: shop.longitude,
                            shop_type: shop.shop_type,
                            categories: shop.categories,
                            status: shop.status
                          });
                          setShowAddModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <FiEdit2 className="inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(shop._id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
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
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing{' '}
          <span className="font-medium">
            {shops.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-medium">
            {Math.min(currentPage * pageSize, totalItems)}
          </span>{' '}
          of <span className="font-medium">{totalItems}</span> results
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {totalPages <= 7 ? (
              [...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border'
                  }`}
                >
                  {index + 1}
                </button>
              ))
            ) : (
              <>
                <PageButton
                  page={1}
                  currentPage={currentPage}
                  onClick={() => handlePageChange(1)}
                />
                {currentPage > 3 && <span className="px-2">...</span>}
                {currentPage > 2 && (
                  <PageButton
                    page={currentPage - 1}
                    currentPage={currentPage}
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                )}
                {currentPage !== 1 && currentPage !== totalPages && (
                  <PageButton
                    page={currentPage}
                    currentPage={currentPage}
                    onClick={() => handlePageChange(currentPage)}
                  />
                )}
                {currentPage < totalPages - 1 && (
                  <PageButton
                    page={currentPage + 1}
                    currentPage={currentPage}
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                )}
                {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                <PageButton
                  page={totalPages}
                  currentPage={currentPage}
                  onClick={() => handlePageChange(totalPages)}
                />
              </>
            )}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-[100]">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white animate-modal-slide-down">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {selectedShop ? 'Edit Shop' : 'Add New Shop'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <FiX className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Shop ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed"
                  value={selectedShop ? formData.shop_id : 'Will be generated automatically'}
                  disabled
                  readOnly
                />
                {!selectedShop && (
                  <p className="mt-1 text-xs text-gray-500">
                    Will be generated automatically based on ward code
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Shop Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={formData.shop_name}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Province ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={formData.province_id}
                  onChange={(e) => setFormData({ ...formData, province_id: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">District ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={formData.district_id}
                  onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Ward Code</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={formData.ward_code}
                  onChange={(e) => setFormData({ ...formData, ward_code: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Street</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Shop Type</label>
                <select
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={formData.shop_type}
                  onChange={(e) => setFormData({ ...formData, shop_type: e.target.value })}
                >
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="col-span-2 flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {selectedShop ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PageButton = ({ page, currentPage, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-md ${
      currentPage === page
        ? 'bg-blue-600 text-white'
        : 'bg-white text-gray-700 hover:bg-gray-50 border'
    }`}
  >
    {page}
  </button>
);

export default ShopManagement;
