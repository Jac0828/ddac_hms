import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingsApiExtended, Booking } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, parseISO } from 'date-fns';
import { 
  FaPlaneArrival, 
  FaPlaneDeparture, 
  FaCalendarCheck, 
  FaSearch, 
  FaPlus,
  FaConciergeBell
} from 'react-icons/fa';
import FeedbackModal, { FeedbackModalProps } from '../components/common/FeedbackModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Admin.css'; // Reuse Admin styles for consistency

const FrontDeskDashboard: React.FC = () => {
  const { isReceptionist, user } = useAuth();
  const navigate = useNavigate();
  const [upcomingCheckIns, setUpcomingCheckIns] = useState<Booking[]>([]);
  const [todayCheckOuts, setTodayCheckOuts] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalProps>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
  });

  useEffect(() => {
    if (!isReceptionist) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isReceptionist, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [checkIns, allBookings] = await Promise.all([
        bookingsApiExtended.getUpcomingCheckIns(7).catch(() => []),
        bookingsApiExtended.getAll().catch(() => []),
      ]);

      const today = new Date();

      // Filter Check-ins for TODAY only for the main card (or keep upcoming for context)
      // Let's separate Today's Arrivals from Upcoming
      const todaysArrivals = checkIns.filter((b: Booking) => 
        isSameDay(parseISO(b.checkInDate), today)
      );

      const checkOuts = allBookings.filter((b: Booking) => {
        const checkOut = parseISO(b.checkOutDate);
        return isSameDay(checkOut, today) && (b.status === 'CheckedIn' || b.status === 'Confirmed');
      });

      // Sort by time or name if needed
      setUpcomingCheckIns(checkIns); // Keep full list or just today's? Let's use upcoming for better utility
      setTodayCheckOuts(checkOuts);
    } catch (err) {
      console.error('Failed to load data:', err);
      showError('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (title: string, message: string) => {
    setFeedbackModal({
      isOpen: true,
      type: 'success',
      title,
      message,
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showError = (title: string, message: string) => {
    setFeedbackModal({
      isOpen: true,
      type: 'error',
      title,
      message,
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const executeCheckIn = async (bookingId: number) => {
    try {
      await bookingsApiExtended.checkIn(bookingId);
      showSuccess('Success', 'Guest checked in successfully!');
      loadData();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckIn = (booking: Booking) => {
    setFeedbackModal({
      isOpen: true,
      type: 'confirm',
      title: 'Check In Guest',
      message: `Confirm check-in for ${(booking as any).user?.firstName} ${(booking as any).user?.lastName}? Room: ${(booking as any).room?.roomNumber}`,
      confirmText: 'Confirm Check-In',
      cancelText: 'Cancel',
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
      onConfirm: () => executeCheckIn(booking.id)
    });
  };

  const executeCheckOut = async (bookingId: number) => {
    try {
      await bookingsApiExtended.checkOut(bookingId);
      showSuccess('Success', 'Guest checked out successfully!');
      loadData();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Check-out failed');
    }
  };

  const handleCheckOut = (booking: Booking) => {
    setFeedbackModal({
      isOpen: true,
      type: 'confirm',
      title: 'Check Out Guest',
      message: `Confirm check-out for ${(booking as any).user?.firstName} ${(booking as any).user?.lastName}? Please ensure payment is settled.`,
      confirmText: 'Confirm Check-Out',
      cancelText: 'Cancel',
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
      onConfirm: () => executeCheckOut(booking.id)
    });
  };

  if (!isReceptionist) {
    return <div className="container mt-5"><div className="alert alert-danger">Access denied</div></div>;
  }

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', position: 'relative', padding: '2rem 0', background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 100%)' }}>
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={feedbackModal.onClose}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onConfirm={feedbackModal.onConfirm}
        confirmText={feedbackModal.confirmText}
        cancelText={feedbackModal.cancelText}
      />

      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C', marginBottom: '0.5rem' }}>Front Desk Dashboard</h2>
            <p className="text-muted mb-0">Welcome back, {user?.firstName}</p>
          </div>
          <div className="d-flex gap-3">
             <button
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', border: 'none', padding: '0.75rem 1.5rem' }}
                onClick={() => navigate('/bookings/create')}
              >
                <FaPlus /> New Walk-In Booking
              </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading Dashboard..." />
        ) : (
          <div className="row g-4">
            {/* Arrivals Column */}
            <div className="col-lg-6">
              <motion.div 
                className="card shadow-sm h-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ borderRadius: '16px', border: '1px solid rgba(201, 169, 97, 0.2)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.95) 100%)', backdropFilter: 'blur(10px)' }}
              >
                <div className="card-header p-4 border-0 bg-transparent d-flex align-items-center gap-3">
                  <div style={{ 
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', 
                    width: '48px', height: '48px', borderRadius: '12px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                  }}>
                    <FaPlaneArrival />
                  </div>
                  <div>
                    <h4 className="mb-0" style={{ fontFamily: 'Playfair Display, serif' }}>Arrivals</h4>
                    <small className="text-muted">Upcoming check-ins</small>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="ps-4 py-3">Guest</th>
                          <th className="py-3">Room</th>
                          <th className="py-3">Date</th>
                          <th className="pe-4 py-3 text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingCheckIns.length === 0 ? (
                           <tr><td colSpan={4} className="text-center py-5 text-muted">No upcoming arrivals</td></tr>
                        ) : (
                          upcomingCheckIns.map((booking) => (
                            <tr key={booking.id}>
                              <td className="ps-4">
                                <div className="fw-bold">{(booking as any).user?.firstName} {(booking as any).user?.lastName}</div>
                                <small className="text-muted">{(booking as any).user?.email}</small>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark border">
                                  RM {(booking as any).room?.roomNumber}
                                </span>
                              </td>
                              <td>{format(parseISO(booking.checkInDate), 'MMM dd')}</td>
                              <td className="pe-4 text-end">
                                {booking.status === 'Confirmed' ? (
                                  <button
                                    className="btn btn-sm btn-success text-white"
                                    onClick={() => handleCheckIn(booking)}
                                    style={{ borderRadius: '20px', padding: '0.25rem 1rem' }}
                                  >
                                    Check In
                                  </button>
                                ) : (
                                  <span className="badge bg-success">Checked In</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Departures Column */}
            <div className="col-lg-6">
              <motion.div 
                className="card shadow-sm h-100"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                style={{ borderRadius: '16px', border: '1px solid rgba(201, 169, 97, 0.2)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.95) 100%)', backdropFilter: 'blur(10px)' }}
              >
                 <div className="card-header p-4 border-0 bg-transparent d-flex align-items-center gap-3">
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)', 
                    width: '48px', height: '48px', borderRadius: '12px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)'
                  }}>
                    <FaPlaneDeparture />
                  </div>
                  <div>
                    <h4 className="mb-0" style={{ fontFamily: 'Playfair Display, serif' }}>Departures</h4>
                    <small className="text-muted">Today's check-outs</small>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="ps-4 py-3">Guest</th>
                          <th className="py-3">Room</th>
                          <th className="py-3">Status</th>
                          <th className="pe-4 py-3 text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayCheckOuts.length === 0 ? (
                           <tr><td colSpan={4} className="text-center py-5 text-muted">No departures today</td></tr>
                        ) : (
                          todayCheckOuts.map((booking) => (
                            <tr key={booking.id}>
                              <td className="ps-4">
                                <div className="fw-bold">{(booking as any).user?.firstName} {(booking as any).user?.lastName}</div>
                              </td>
                              <td>
                                 <span className="badge bg-light text-dark border">
                                  RM {(booking as any).room?.roomNumber}
                                </span>
                              </td>
                              <td>
                                <span className={`badge bg-${booking.status === 'CheckedIn' ? 'warning' : 'secondary'}`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="pe-4 text-end">
                                {booking.status === 'CheckedIn' && (
                                  <button
                                    className="btn btn-sm btn-warning text-white"
                                    onClick={() => handleCheckOut(booking)}
                                    style={{ borderRadius: '20px', padding: '0.25rem 1rem' }}
                                  >
                                    Check Out
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Links Grid */}
            <div className="col-12">
              <div className="row g-4">
                <div className="col-md-4">
                  <motion.div 
                    className="card shadow-sm p-3 text-center cursor-pointer hover-lift"
                    whileHover={{ y: -5 }}
                    onClick={() => navigate('/bookings')}
                    style={{ borderRadius: '16px', border: '1px solid rgba(201, 169, 97, 0.4)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.95) 100%)' }}
                  >
                    <div className="card-body">
                      <FaCalendarCheck size={32} className="mb-3" style={{ color: '#C9A961' }} />
                      <h5>All Bookings</h5>
                      <p className="text-muted small mb-0">View and manage reservation list</p>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-4">
                  <motion.div 
                    className="card shadow-sm p-3 text-center cursor-pointer hover-lift"
                    whileHover={{ y: -5 }}
                    onClick={() => navigate('/manager/rooms')}
                    style={{ borderRadius: '16px', border: '1px solid rgba(201, 169, 97, 0.4)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.95) 100%)' }}
                  >
                    <div className="card-body">
                      <FaSearch size={32} className="mb-3" style={{ color: '#8B6F47' }} />
                      <h5>Room Status</h5>
                      <p className="text-muted small mb-0">Check availability and room conditions</p>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-4">
                   <motion.div 
                    className="card shadow-sm p-3 text-center cursor-pointer hover-lift"
                    whileHover={{ y: -5 }}
                    onClick={() => navigate('/service-requests')}
                    style={{ borderRadius: '16px', border: '1px solid rgba(201, 169, 97, 0.4)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.95) 100%)' }}
                  >
                    <div className="card-body">
                      <FaConciergeBell size={32} className="mb-3" style={{ color: '#C9A961' }} />
                      <h5>Service Requests</h5>
                      <p className="text-muted small mb-0">Handle guest inquiries and needs</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FrontDeskDashboard;
