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
    const [isClosing, setIsClosing] = useState(false);

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

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate số lượng shop
        if (selectedShops.length < 2) {
            toast.error('Please select at least 2 shops');
            return;
        }

        // Validate vehicle type
        if (!formData.vehicle_type_id) {
            toast.error('Please select a vehicle type');
            return;
        }

        const routeData = {
            shops: selectedShops,
            vehicle_type_id: formData.vehicle_type_id
        };

        onAdd(routeData);
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

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    return (
        <div 
            className={`fixed inset-0 z-50 ${
                isClosing ? 'animate-fade-out' : 'animate-fade-in'
            }`}
        >
            <div 
                className={`absolute inset-0 bg-gray-600 bg-opacity-50 ${
                    isClosing ? 'animate-modal-overlay-hide' : 'animate-modal-overlay-show'
                }`}
                onClick={handleClose}
            />

            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div 
                    className={`relative w-[95%] md:w-[800px] bg-white rounded-xl shadow-2xl 
                        ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
                >
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-800">Create New Route</h3>
                                <p className="mt-1 text-sm text-gray-500">Fill in the details to create a new delivery route</p>
                            </div>
                            <button 
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
                            >
                                <FiX className="h-6 w-6 text-gray-500 group-hover:text-gray-700" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-lg font-medium text-gray-700 mb-4">Step 1: Select Location</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Province <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.province_id}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                province_id: e.target.value,
                                                district_id: '',
                                                ward_code: ''
                                            })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
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

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            District <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.district_id}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                district_id: e.target.value,
                                                ward_code: ''
                                            })}
                                            className={`w-full rounded-lg border-gray-300 shadow-sm transition-all duration-200 
                                                ${!formData.province_id ? 'bg-gray-100' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
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

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Ward <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.ward_code}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                ward_code: e.target.value
                                            })}
                                            className={`w-full rounded-lg border-gray-300 shadow-sm transition-all duration-200
                                                ${!formData.district_id ? 'bg-gray-100' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
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
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-lg font-medium text-gray-700 mb-4">Step 2: Select Vehicle Type</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Vehicle Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.vehicle_type_id}
                                            onChange={(e) => setFormData({ ...formData, vehicle_type_id: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                            required
                                        >
                                            <option value="">Select Vehicle Type</option>
                                            {vehicleTypes.map((type) => (
                                                <option key={type._id} value={type.code}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-medium text-gray-700">Step 3: Select Shops</h4>
                                    <div className="text-sm text-gray-500">
                                        Selected: <span className="font-medium text-blue-600">{selectedShops.length}</span>
                                        <span className="text-xs ml-2">(Minimum 2 required)</span>
                                    </div>
                                </div>
                                
                                <div className="border rounded-lg bg-white max-h-[300px] overflow-y-auto shadow-inner">
                                    {filteredShops.map((shop) => {
                                        const isSelected = selectedShops.some(s => s.shop_id === shop.shop_id);
                                        return (
                                            <div
                                                key={shop.shop_id}
                                                className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors duration-200 ${
                                                    isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''
                                                }`}
                                                onClick={() => handleShopSelect(shop)}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {}}
                                                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-800">{shop.shop_name}</div>
                                                        <div className="text-sm text-gray-600">
                                                            {shop.house_number && `${shop.house_number}, `}{shop.street}
                                                        </div>
                                                        <div className="text-xs text-gray-400 flex justify-between mt-1">
                                                            <span>ID: {shop.shop_id}</span>
                                                            <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                                                {shop.shop_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredShops.length === 0 && (
                                        <div className="p-8 text-center text-gray-500">
                                            {formData.ward_code 
                                                ? 'No active shops found in this area' 
                                                : 'Please select a ward to view available shops'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200">
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 
                                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 
                                            transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={`px-6 py-2.5 rounded-lg transition-all duration-200 
                                            ${selectedShops.length >= 2
                                                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                                : 'bg-blue-300 text-white cursor-not-allowed'
                                            }`}
                                        disabled={selectedShops.length < 2}
                                    >
                                        Create Route
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddRouteModal;