import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const AddRouteModal = ({ onClose, onAdd, vehicleTypes }) => {
    const [formData, setFormData] = useState({
        province_id: '',
        district_id: '',
        ward_code: '',
        vehicle_type_id: '',
    });
    
    const [selectedShops, setSelectedShops] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [shops, setShops] = useState([]);
    const [filteredShops, setFilteredShops] = useState([]);

    // Fetch provinces when component mounts
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/provinces', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setProvinces(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching provinces:', error);
                toast.error('Failed to load provinces');
            }
        };
        fetchProvinces();
    }, []);

    // Fetch districts when province changes
    useEffect(() => {
        const fetchDistricts = async () => {
            if (!formData.province_id) {
                setDistricts([]);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:5000/api/districts?province_id=${formData.province_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setDistricts(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching districts:', error);
                toast.error('Failed to load districts');
            }
        };
        fetchDistricts();
    }, [formData.province_id]);

    // Fetch wards when district changes
    useEffect(() => {
        const fetchWards = async () => {
            if (!formData.district_id) {
                setWards([]);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:5000/api/wards?district_id=${formData.district_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setWards(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching wards:', error);
                toast.error('Failed to load wards');
            }
        };
        fetchWards();
    }, [formData.district_id]);

    // Fetch shops when ward changes
    useEffect(() => {
        const fetchShops = async () => {
            if (!formData.ward_code) {
                setShops([]);
                setFilteredShops([]);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/shops', {
                    params: {
                        ward_code: formData.ward_code,
                        status: 'active'
                    },
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    const shopData = response.data.data;
                    console.log('Fetched shops:', shopData);
                    setShops(shopData);
                    setFilteredShops(shopData);
                }
            } catch (error) {
                console.error('Error fetching shops:', error);
                toast.error('Failed to load shops');
            }
        };

        fetchShops();
    }, [formData.ward_code]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedShops.length < 2) {
            toast.error('Please select at least 2 shops');
            return;
        }

        try {
            const routeData = {
                shop_ids: selectedShops.map(shop => shop.shop_id),
                vehicle_type_id: formData.vehicle_type_id
            };
            console.log('Submitting route data:', routeData);
            await onAdd(routeData);
            onClose();
        } catch (error) {
            console.error('Error creating route:', error);
            toast.error('Failed to create route');
        }
    };

    const handleShopSelect = (shop) => {
        setSelectedShops(prevSelected => {
            const isSelected = prevSelected.some(s => s.shop_id === shop.shop_id);
            if (isSelected) {
                return prevSelected.filter(s => s.shop_id !== shop.shop_id);
            } else {
                return [...prevSelected, shop];
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-[90%] md:w-[600px] shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Add New Route</h3>
                    <button onClick={onClose}>
                        <FiX className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Location Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Province</label>
                            <select
                                value={formData.province_id}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    province_id: e.target.value,
                                    district_id: '',
                                    ward_code: ''
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                required
                            >
                                <option value="">Select Province</option>
                                {provinces.map((province) => (
                                    <option key={province.province_id} value={province.province_id}>
                                        {province.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">District</label>
                            <select
                                value={formData.district_id}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    district_id: e.target.value,
                                    ward_code: ''
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                disabled={!formData.province_id}
                                required
                            >
                                <option value="">Select District</option>
                                {districts.map((district) => (
                                    <option key={district.district_id} value={district.district_id}>
                                        {district.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ward</label>
                            <select
                                value={formData.ward_code}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    ward_code: e.target.value
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                disabled={!formData.district_id}
                                required
                            >
                                <option value="">Select Ward</option>
                                {wards.map((ward) => (
                                    <option key={ward.ward_code} value={ward.ward_code}>
                                        {ward.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Vehicle Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                        <select
                            value={formData.vehicle_type_id}
                            onChange={(e) => setFormData({
                                ...formData,
                                vehicle_type_id: e.target.value
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        >
                            <option value="">Select Vehicle Type</option>
                            {vehicleTypes.map((type) => (
                                <option key={type.code} value={type.code}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Shop Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Shops ({selectedShops.length} selected)
                            {selectedShops.length > 0 && (
                                <span className="text-xs text-gray-500 ml-2">
                                    (Minimum 2 shops required)
                                </span>
                            )}
                        </label>
                        <div className="border rounded-md max-h-60 overflow-y-auto">
                            {filteredShops.map((shop) => {
                                const isSelected = selectedShops.some(s => s.shop_id === shop.shop_id);
                                return (
                                    <div
                                        key={shop.shop_id}
                                        className={`p-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-2 ${
                                            isSelected ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => handleShopSelect(shop)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {}}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{shop.shop_name}</div>
                                            <div className="text-sm text-gray-500">
                                                {shop.house_number && `${shop.house_number}, `}{shop.street}
                                            </div>
                                            <div className="text-xs text-gray-400 flex justify-between">
                                                <span>ID: {shop.shop_id}</span>
                                                <span>Type: {shop.shop_type}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredShops.length === 0 && (
                                <div className="p-4 text-center text-gray-500">
                                    {formData.ward_code 
                                        ? 'No active shops found in this area' 
                                        : 'Please select a ward to view shops'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded-md ${
                                selectedShops.length >= 2
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-blue-300 text-white cursor-not-allowed'
                            }`}
                            disabled={selectedShops.length < 2}
                        >
                            Create Route
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRouteModal;