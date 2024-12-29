import React from 'react';
import Header from './Header';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="404 Not Found" />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Trang này không tồn tại</h2>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
