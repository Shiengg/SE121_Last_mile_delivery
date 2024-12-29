import React from 'react';
import Header from '../components/Shared/Header';
import Footer from '../components/Shared/Footer';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header title="Admin Dashboard" />
      
      <main className="flex-grow max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Nội dung của dashboard */}
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
            {/* Thêm các component khác của dashboard vào đây */}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;