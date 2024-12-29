import React from 'react';
import Header from '../components/Shared/Header';

const DeliveryDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Bảng Điều Khiển Giao Hàng" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Thông tin người giao hàng */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">Thông Tin Shipper</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">ID: #12345</p>
              <p className="text-gray-600">Khu vực: Quận 1, TP.HCM</p>
            </div>
            <div>
              <p className="text-green-600 font-semibold">Trạng thái: Đang hoạt động</p>
              <p className="text-gray-600">Đơn hàng đã giao: 15</p>
            </div>
          </div>
        </div>

        {/* Danh sách đơn hàng cần giao */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Đơn Hàng Cần Giao</h2>
          {/* List of orders */}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
