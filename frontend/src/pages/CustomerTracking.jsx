const CustomerTracking = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-green-600 mb-4">
        Theo Dõi Đơn Hàng
      </h1>

      {/* Thông tin đơn hàng */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Chi Tiết Đơn Hàng</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Mã đơn: #67890</p>
            <p className="text-gray-600">Địa chỉ nhận: 123 Nguyễn Huệ, Q1</p>
          </div>
          <div>
            <p className="text-orange-600 font-semibold">Trạng thái: Đang giao</p>
            <p className="text-gray-600">Thời gian dự kiến: 15:30</p>
          </div>
        </div>
      </div>

      {/* Bản đồ theo dõi */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Vị Trí Đơn Hàng</h2>
        {/* Map component */}
      </div>
    </div>
  );
};

export default CustomerTracking;