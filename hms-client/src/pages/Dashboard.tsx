import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsApi, Booking } from '../services/api';
import { roomsApi, Room } from '../services/api';
import { serviceRequestsApi, ServiceRequest } from '../services/api';
import { checkHealth, getApiBaseUrl } from '../lib/api';
import { motion } from 'framer-motion';
import ManagerDashboard from './ManagerDashboard';
import FrontDeskDashboard from './FrontDeskDashboard';
import HousekeepingDashboard from './HousekeepingDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin, isManager, isReceptionist, isRoomAttendant, isCustomer } = useAuth();
  
  // Route to role-specific dashboards
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  if (isCustomer) {
    return <Navigate to="/" replace />;
  }
  if (isManager) {
    return <ManagerDashboard />;
  }
  if (isReceptionist) {
    return <FrontDeskDashboard />;
  }
  if (isRoomAttendant) {
    return <HousekeepingDashboard />;
  }
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsData, roomsData, serviceRequestsData, healthData] = await Promise.all([
          bookingsApi.getAll().catch(() => []),
          roomsApi.getAll().catch(() => []),
          serviceRequestsApi.getAll().catch(() => []),
          checkHealth().catch(() => null),
        ]);
        setBookings(bookingsData);
        setRooms(roomsData);
        setServiceRequests(serviceRequestsData);
        setHealth(healthData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusCounts = (items: Booking[] | ServiceRequest[], statusField: 'status') => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const status = item[statusField].toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  const bookingCounts = getStatusCounts(bookings, 'status');
  const requestCounts = getStatusCounts(serviceRequests, 'status');

  const availableRooms = rooms.filter(r => r.status.toLowerCase() === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status.toLowerCase() === 'occupied').length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="gradient-background">
          <div className="gradient-shape gradient-shape-1"></div>
          <div className="gradient-shape gradient-shape-2"></div>
          <div className="gradient-shape gradient-shape-3"></div>
        </div>
        <div className="dashboard-loading">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="spinner-circle"></div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading dashboard...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Animated Gradient Background */}
      <div className="gradient-background">
        <div className="gradient-shape gradient-shape-1"></div>
        <div className="gradient-shape gradient-shape-2"></div>
        <div className="gradient-shape gradient-shape-3"></div>
        <div className="gradient-shape gradient-shape-4"></div>
      </div>

      <div className="dashboard-content">
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <motion.div
              className="welcome-icon"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              👋
            </motion.div>
            <div>
              <h1 className="dashboard-title">Dashboard</h1>
              {user && (
                <p className="dashboard-subtitle">
                  Welcome back, <span className="user-name">{user.firstName} {user.lastName}</span>!
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Admin Dashboard - Redirect to Admin Panel */}
        {isAdmin && (
          <motion.div
            className="admin-redirect-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="redirect-content">
              <motion.div
                className="redirect-icon"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              >
                ⚡
              </motion.div>
              <h3>Admin Dashboard</h3>
              <p>You are being redirected to the Admin Panel...</p>
              <Link to="/admin" className="btn btn-primary redirect-button">
                Go to Admin Panel
              </Link>
            </div>
          </motion.div>
        )}

        {/* Receptionist Dashboard */}
        {isReceptionist && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="stats-grid">
              <motion.div className="stat-card stat-card-primary" variants={cardVariants}>
                <div className="stat-icon">📥</div>
                <div className="stat-content">
                  <h3 className="stat-label">Today's Check-ins</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  >
                    {bookings.filter(b => {
                      const checkIn = new Date(b.checkInDate);
                      const today = new Date();
                      return checkIn.toDateString() === today.toDateString() && 
                             b.status.toLowerCase() !== 'checkedin' &&
                             b.status.toLowerCase() !== 'cancelled';
                    }).length}
                  </motion.h2>
                </div>
              </motion.div>

              <motion.div className="stat-card stat-card-info" variants={cardVariants}>
                <div className="stat-icon">📤</div>
                <div className="stat-content">
                  <h3 className="stat-label">Today's Check-outs</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                  >
                    {bookings.filter(b => {
                      const checkOut = new Date(b.checkOutDate);
                      const today = new Date();
                      return checkOut.toDateString() === today.toDateString() && 
                             b.status.toLowerCase() === 'checkedin';
                    }).length}
                  </motion.h2>
                </div>
              </motion.div>

              <motion.div className="stat-card stat-card-warning" variants={cardVariants}>
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h3 className="stat-label">Pending Bookings</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                  >
                    {bookingCounts.pending || 0}
                  </motion.h2>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="dashboard-section"
              variants={cardVariants}
            >
              <div className="section-header">
                <h3 className="section-title">📋 Recent Bookings</h3>
                <Link to="/bookings" className="section-link">
                  View All →
                </Link>
              </div>
              <div className="section-content">
                {bookings.slice(0, 10).length === 0 ? (
                  <p className="empty-state">No bookings yet</p>
                ) : (
                  <div className="table-container">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Room</th>
                          <th>Guest</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.slice(0, 10).map((booking, index) => (
                          <motion.tr
                            key={booking.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.01, backgroundColor: 'rgba(102, 126, 234, 0.05)' }}
                          >
                            <td>Room {booking.room?.roomNumber}</td>
                            <td>{booking.user?.firstName} {booking.user?.lastName}</td>
                            <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                            <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge badge-${booking.status.toLowerCase() === 'pending' ? 'warning' : 'success'}`}>
                                {booking.status}
                              </span>
                            </td>
                            <td>
                              <Link to={`/bookings/${booking.id}`} className="table-link">
                                View
                              </Link>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Room Attendant Dashboard */}
        {isRoomAttendant && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="stats-grid">
              <motion.div className="stat-card stat-card-warning" variants={cardVariants}>
                <div className="stat-icon">🧹</div>
                <div className="stat-content">
                  <h3 className="stat-label">Pending Requests</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  >
                    {requestCounts.pending || 0}
                  </motion.h2>
                </div>
              </motion.div>

              <motion.div className="stat-card stat-card-success" variants={cardVariants}>
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3 className="stat-label">Completed Today</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                  >
                    {requestCounts.completed || 0}
                  </motion.h2>
                </div>
              </motion.div>

              <motion.div className="stat-card stat-card-info" variants={cardVariants}>
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <h3 className="stat-label">In Progress</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                  >
                    {requestCounts.inprogress || 0}
                  </motion.h2>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="dashboard-section"
              variants={cardVariants}
            >
              <div className="section-header">
                <h3 className="section-title">🔧 My Tasks</h3>
                <Link to="/service-requests" className="section-link">
                  View All →
                </Link>
              </div>
              <div className="section-content">
                {serviceRequests.slice(0, 10).length === 0 ? (
                  <p className="empty-state">No service requests yet</p>
                ) : (
                  <div className="table-container">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Room</th>
                          <th>Service Type</th>
                          <th>Status</th>
                          <th>Requested</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceRequests.slice(0, 10).map((request, index) => (
                          <motion.tr
                            key={request.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.01, backgroundColor: 'rgba(102, 126, 234, 0.05)' }}
                          >
                            <td>Room {request.booking?.room?.roomNumber}</td>
                            <td>{request.serviceType}</td>
                            <td>
                              <span className={`badge badge-${request.status.toLowerCase() === 'pending' ? 'warning' : request.status.toLowerCase() === 'completed' ? 'success' : 'info'}`}>
                                {request.status}
                              </span>
                            </td>
                            <td>{new Date(request.requestedAt).toLocaleDateString()}</td>
                            <td>
                              <Link to={`/service-requests`} className="table-link">
                                View
                              </Link>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Customer Dashboard */}
        {isCustomer && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="stats-grid">
              <motion.div className="stat-card stat-card-primary" variants={cardVariants}>
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h3 className="stat-label">My Bookings</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  >
                    {bookings.length}
                  </motion.h2>
                </div>
              </motion.div>

              <motion.div className="stat-card stat-card-success" variants={cardVariants}>
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3 className="stat-label">Confirmed</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                  >
                    {bookingCounts.confirmed || 0}
                  </motion.h2>
                </div>
              </motion.div>

              <motion.div className="stat-card stat-card-info" variants={cardVariants}>
                <div className="stat-icon">🏨</div>
                <div className="stat-content">
                  <h3 className="stat-label">Available Rooms</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                  >
                    {availableRooms}
                  </motion.h2>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="dashboard-section"
              variants={cardVariants}
            >
              <div className="section-header">
                <h3 className="section-title">📋 My Bookings</h3>
                <Link to="/bookings" className="section-link">
                  View All →
                </Link>
              </div>
              <div className="section-content">
                {bookings.length === 0 ? (
                  <div className="empty-state-card">
                    <motion.div
                      className="empty-icon"
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    >
                      📭
                    </motion.div>
                    <p>No bookings yet</p>
                    <Link to="/rooms" className="btn btn-primary">
                      Browse Rooms
                    </Link>
                  </div>
                ) : (
                  <div className="bookings-grid">
                    {bookings.slice(0, 6).map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        className="booking-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                      >
                        <div className="booking-header">
                          <span className="booking-room">Room {booking.room?.roomNumber}</span>
                          <span className={`badge badge-${booking.status.toLowerCase() === 'pending' ? 'warning' : booking.status.toLowerCase() === 'confirmed' ? 'success' : 'info'}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="booking-details">
                          <div className="booking-date">
                            <span className="date-label">Check-in</span>
                            <span className="date-value">{new Date(booking.checkInDate).toLocaleDateString()}</span>
                          </div>
                          <div className="booking-date">
                            <span className="date-label">Check-out</span>
                            <span className="date-value">{new Date(booking.checkOutDate).toLocaleDateString()}</span>
                          </div>
                          <div className="booking-price">
                            ${booking.totalPrice?.toFixed(2) || booking.totalAmount?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <Link to={`/bookings/${booking.id}`} className="booking-link">
                          View Details →
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Manager Dashboard */}
        {isManager && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="stats-grid">
              <motion.div className="stat-card stat-card-primary" variants={cardVariants}>
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3 className="stat-label">Total Bookings</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  >
                    {bookings.length}
                  </motion.h2>
                </div>
              </motion.div>

              <motion.div className="stat-card stat-card-success" variants={cardVariants}>
                <div className="stat-icon">🏨</div>
                <div className="stat-content">
                  <h3 className="stat-label">Available Rooms</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                  >
                    {availableRooms}
                  </motion.h2>
                </div>
              </motion.div>

              <motion.div className="stat-card stat-card-warning" variants={cardVariants}>
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h3 className="stat-label">Pending Requests</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                  >
                    {requestCounts.pending || 0}
                  </motion.h2>
                </div>
              </motion.div>

              <motion.div className="stat-card stat-card-info" variants={cardVariants}>
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3 className="stat-label">Occupied Rooms</h3>
                  <motion.h2
                    className="stat-value"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
                  >
                    {occupiedRooms}
                  </motion.h2>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Health Status */}
        {health && (
          <motion.div
            className="health-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="health-indicator">🟢</span>
            <span className="health-text">API Status: {health.status}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
