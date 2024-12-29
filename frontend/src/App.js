import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import CustomerTracking from './pages/CustomerTracking';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/delivery-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['DeliveryStaff']}>
              <DeliveryDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer-tracking" 
          element={
            <ProtectedRoute allowedRoles={['Customer']}>
              <CustomerTracking />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Login />} />
        <Route path="*" element={<div>404 - Không tìm thấy trang</div>} />
      </Routes>
    </Router>
  );
}

export default App;