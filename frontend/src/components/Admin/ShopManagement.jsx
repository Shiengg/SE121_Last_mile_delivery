import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { AdminContext } from '../../contexts/AdminContext';
import { useNotifications } from '../../contexts/NotificationContext';

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
      
      if (selectedShop) {
        await axios.put(
          `http://localhost:5000/api/shops/${selectedShop._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        toast.success('Shop updated successfully');
      } else {
        await axios.post(
          'http://localhost:5000/api/shops',
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        toast.success('Shop added successfully');
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
      toast.error(selectedShop ? 'Failed to update shop' : 'Failed to add shop');
      console.error('Submit error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/shops/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Shop deleted successfully');
        
        await fetchShops(currentPage, searchTerm);
        await fetchStats();
        
        const activitiesResponse = await axios.get('http://localhost:5000/api/activities/recent', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (activitiesResponse.data.success) {
          updateNotifications(activitiesResponse.data.data);
        }
      } catch (error) {
        toast.error('Failed to delete shop');
        console.error('Delete error:', error);
      }
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Shop Management</h2>
        <button
          onClick={() => {
            setSelectedShop(null);
            setFormData({ shop_id: '', shop_name: '', country_id: 'VN', province_id: '', district_id: '', ward_code: '', house_number: '', street: '', latitude: '', longitude: '', shop_type: 'retail', categories: [], status: 'active' });
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiPlus className="inline mr-2" />
          Add New Shop
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search shops..."
            className="w-full px-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <FiSearch className="absolute right-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Shop List with fixed height */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
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
                {visibleShops.map((shop) => (
                  <tr key={shop._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{shop.shop_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{shop.shop_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {`${shop.street}, ${shop.ward_code}, ${shop.district_id}, ${shop.province_id}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        {`${shop.latitude}, ${shop.longitude}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{shop.shop_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        shop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Simplified Pagination */}
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

          {/* Simplified Page Numbers */}
          <div className="flex space-x-1">
            {totalPages <= 7 ? (
              // Hiển thị tất cả các trang nếu tổng số trang <= 7
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
              // Hiển thị trang đầu, trang cuối và các trang xung quanh trang hiện tại
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

      {/* Updated Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {selectedShop ? 'Edit Shop' : 'Add New Shop'}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Shop ID</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    value={formData.shop_id}
                    onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                    required
                  />
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
