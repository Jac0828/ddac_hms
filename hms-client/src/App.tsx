import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import RoomsList from './components/RoomsList';
import Dashboard from './pages/Dashboard';
import RoomDetails from './pages/RoomDetails';
import CheckAvailability from './pages/CheckAvailability';
import CreateBooking from './pages/CreateBooking';
import BookingsList from './pages/BookingsList';
import BookingDetails from './pages/BookingDetails';
import ServiceRequests from './pages/ServiceRequests';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import MembershipBenefits from './pages/MembershipBenefits';
import Roles from './pages/Roles';
import RoomTypesManagement from './pages/RoomTypesManagement';
import DutyRosterManagement from './pages/DutyRosterManagement';
import ManagerRoomList from './pages/ManagerRoomList';
import ManagerReviews from './pages/ManagerReviews';
import StaffList from './pages/StaffList';
import AuditLogs from './pages/AuditLogs';
import PaymentRecord from './pages/PaymentRecord';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Wait for auth state to be restored from localStorage
  if (isLoading) {
    return null; // Or a loading spinner
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Root redirect component - redirects authenticated users to their home page
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading, isAdmin, isManager, isReceptionist, isRoomAttendant, isCustomer } = useAuth();
  
  // Wait for auth state to be restored from localStorage
  if (isLoading) {
    return <Home />; // Show home page while loading
  }
  
  if (!isAuthenticated || !user) {
    return <Home />;
  }
  
  // Redirect based on role
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  } else if (isManager || isReceptionist || isRoomAttendant) {
    return <Navigate to="/dashboard" replace />;
  } else if (isCustomer) {
    return <Home />;
  }
  
  // Default fallback
  return <Home />;
};

import { SettingsProvider } from './contexts/SettingsContext';

const AppContent: React.FC = () => {
  return (
    <SettingsProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/roles" element={<PrivateRoute><Roles /></PrivateRoute>} />
        <Route path="/manager/room-types" element={<PrivateRoute><RoomTypesManagement /></PrivateRoute>} />
        <Route path="/manager/rooms" element={<PrivateRoute><ManagerRoomList /></PrivateRoute>} />
        <Route path="/manager/staff" element={<PrivateRoute><StaffList /></PrivateRoute>} />
        <Route path="/manager/duty-roster" element={<PrivateRoute><DutyRosterManagement /></PrivateRoute>} />
        <Route path="/manager/reviews" element={<PrivateRoute><ManagerReviews /></PrivateRoute>} />
        <Route path="/manager/payments" element={<PrivateRoute><PaymentRecord /></PrivateRoute>} />
        <Route path="/admin/audit-logs" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
        <Route path="/rooms" element={<RoomsList />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/check-availability" element={<CheckAvailability />} />
        <Route path="/bookings" element={<PrivateRoute><BookingsList /></PrivateRoute>} />
        <Route path="/bookings/create" element={<PrivateRoute><CreateBooking /></PrivateRoute>} />
        <Route path="/bookings/:id" element={<PrivateRoute><BookingDetails /></PrivateRoute>} />
        <Route path="/service-requests" element={<PrivateRoute><ServiceRequests /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/membership-benefits" element={<PrivateRoute><MembershipBenefits /></PrivateRoute>} />
      </Routes>
    </Router>
    </SettingsProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
