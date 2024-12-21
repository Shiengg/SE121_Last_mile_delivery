import React from 'react'
import { Route, Router } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  return (
    // <Router>
    //   <Route>
    //     <Route path='/admin' element={<AdminDashboard />}/>
    //   </Route>
    // </Router>
    <AdminDashboard/>
  );
};

export default App;