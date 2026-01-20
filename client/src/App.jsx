import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import UserTickets from './pages/UserTickets';
import SubmitRequest from './pages/SubmitRequest';
import UserProfile from './pages/UserProfile';
import TicketDetail from './pages/TicketDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminTickets from './pages/AdminTickets';
import StaffManagement from './pages/StaffManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function PrivateRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />} />
      
      {/* User Routes */}
      <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
      <Route path="/tickets" element={<PrivateRoute><UserTickets /></PrivateRoute>} />
      <Route path="/submit" element={<PrivateRoute><SubmitRequest /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
      <Route path="/ticket/:id" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<PrivateRoute requireAdmin><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/tickets" element={<PrivateRoute requireAdmin><AdminTickets /></PrivateRoute>} />
      <Route path="/admin/ticket/:id" element={<PrivateRoute requireAdmin><TicketDetail /></PrivateRoute>} />
      <Route path="/admin/staff" element={<PrivateRoute requireAdmin><StaffManagement /></PrivateRoute>} />
      <Route path="/admin/reports" element={<PrivateRoute requireAdmin><Reports /></PrivateRoute>} />
      <Route path="/admin/settings" element={<PrivateRoute requireAdmin><Settings /></PrivateRoute>} />
      
      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} />} />
    </Routes>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
