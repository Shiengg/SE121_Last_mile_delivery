import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import CustomerTracking from './pages/CustomerTracking';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ProtectedRoute from './components/ProtectedRoute';
import ShopManagement from './components/Admin/ShopManagement';
import RouteManagement from './components/Admin/RouteManagement';
import VehicleManagement from './components/Admin/VehicleManagement';
import NotFound from './components/Shared/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Public Routes */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        
        {/* Admin Dashboard Routes */}
        <Route 
          path="/admin-dashboard/*" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        >
          <Route path="shops" element={<ShopManagement />} />
          <Route path="routes" element={<RouteManagement />} />
          <Route path="vehicle-types" element={<VehicleManagement />} />
        </Route>

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

        {/* Profile & Settings Routes - accessible by all authenticated users */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'DeliveryStaff', 'Customer']}>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'DeliveryStaff', 'Customer']}>
              <Settings />
            </ProtectedRoute>
          } 
        />

        <Route path="/" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;