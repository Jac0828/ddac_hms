import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import RoomsList from './components/RoomsList';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/rooms" element={<RoomsList />} />
        <Route
          path="/bookings"
          element={
            <PrivateRoute>
              <div className="container mt-5">
                <h2>My Bookings</h2>
                <p>Bookings feature coming soon...</p>
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/check-availability"
          element={
            <div className="container mt-5">
              <h2>Check Availability</h2>
              <p>Availability checker coming soon...</p>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
