import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { bookingsApi, Booking } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarCheck, FaBed, FaUser, FaMoneyBillWave, FaInfoCircle, FaTimes, FaCheck, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import './Admin.css'; // Keep Admin styles for utility classes
import '../components/Home.css'; // Import Home styles for luxury theme
import LuxurySelect from '../components/common/LuxurySelect'; // Import LuxurySelect

const BookingsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, isManager, isReceptionist } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const data = await bookingsApi.getAll();
        // Sort by most recent first
        const sortedData = data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setBookings(sortedData);
      } catch (err) {
        setError(t('bookings.loadError') || 'Failed to load bookings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, isLoading, navigate, searchParams]);

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm(t('bookings.cancelConfirm') || 'Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingsApi.cancel(id);
      setBookings(bookings.filter(b => b.id !== id));
    } catch (err) {
      alert(t('bookings.cancelError') || 'Failed to cancel booking');
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await bookingsApi.updateStatus(id, newStatus);
      setBookings(bookings.map(b => 
        b.id === id ? { ...b, status: newStatus } : b
      ));
    } catch (err) {
      alert(t('bookings.updateError') || 'Failed to update booking status');
    }
  };

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status.toLowerCase() === filterStatus.toLowerCase());

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'confirmed') return '#28a745';
    if (statusLower === 'pending') return '#ffc107';
    if (statusLower === 'checkedin') return '#17a2b8';
    if (statusLower === 'checkedout') return '#6c757d';
    if (statusLower === 'cancelled') return '#dc3545';
    return '#6c757d';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) return <LoadingSpinner text={t('auth.authenticating') || "Authenticating..."} />;
  if (!isAuthenticated) return null;
  if (loading) return <LoadingSpinner text={t('bookings.loading') || "Loading Bookings..."} />;

  return (
    <div className="home-container" style={{ paddingTop: '2rem', paddingBottom: '4rem', minHeight: '100vh', background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 100%)' }}>
      <div className="container">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="d-flex justify-content-end align-items-center mb-2"
        >
        </motion.div>

        {(isManager || isReceptionist) && (
          <motion.div 
            className="card shadow-lg border-0 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ 
              borderRadius: '16px', 
              background: 'rgba(255, 255, 255, 0.95)', 
              backdropFilter: 'blur(10px)',
              position: 'relative',
              zIndex: 10,
              overflow: 'visible'
            }}
          >
            <div className="card-body px-4 py-3">
              <div className="row align-items-center">
                <div className="col-md-3">
                  <label className="form-label fw-bold text-uppercase small text-muted">{t('bookings.filterStatus') || 'Filter by Status'}</label>
                  <LuxurySelect
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={[
                      { value: 'all', label: t('bookings.status.all') || 'All Statuses' },
                      { value: 'pending', label: t('bookings.status.pending') || 'Pending' },
                      { value: 'confirmed', label: t('bookings.status.confirmed') || 'Confirmed' },
                      { value: 'checkedin', label: t('bookings.status.checkedIn') || 'Checked In' },
                      { value: 'checkedout', label: t('bookings.status.checkedOut') || 'Checked Out' },
                      { value: 'cancelled', label: t('bookings.status.cancelled') || 'Cancelled' },
                    ]}
                  />
                </div>
                <div className="col-md-9">
                  <label className="form-label fw-bold text-uppercase small text-muted d-block">{t('bookings.overview') || 'Overview'}</label>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="badge rounded-pill py-2 px-3" style={{ background: 'rgba(255, 193, 7, 0.2)', color: '#856404', border: '1px solid rgba(255, 193, 7, 0.3)' }}>{t('bookings.status.pending')}: {bookings.filter(b => b.status.toLowerCase() === 'pending').length}</span>
                    <span className="badge rounded-pill py-2 px-3" style={{ background: 'rgba(40, 167, 69, 0.2)', color: '#155724', border: '1px solid rgba(40, 167, 69, 0.3)' }}>{t('bookings.status.confirmed')}: {bookings.filter(b => b.status.toLowerCase() === 'confirmed').length}</span>
                    <span className="badge rounded-pill py-2 px-3" style={{ background: 'rgba(23, 162, 184, 0.2)', color: '#117a8b', border: '1px solid rgba(23, 162, 184, 0.3)' }}>{t('bookings.status.checkedIn')}: {bookings.filter(b => b.status.toLowerCase() === 'checkedin').length}</span>
                    <span className="badge rounded-pill py-2 px-3" style={{ background: 'rgba(108, 117, 125, 0.2)', color: '#383d41', border: '1px solid rgba(108, 117, 125, 0.3)' }}>{t('bookings.status.checkedOut')}: {bookings.filter(b => b.status.toLowerCase() === 'checkedout').length}</span>
                    <span className="badge rounded-pill py-2 px-3" style={{ background: 'rgba(220, 53, 69, 0.2)', color: '#721c24', border: '1px solid rgba(220, 53, 69, 0.3)' }}>{t('bookings.status.cancelled')}: {bookings.filter(b => b.status.toLowerCase() === 'cancelled').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 shadow-sm" style={{ borderRadius: '12px' }}>
            <FaInfoCircle /> {error}
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <motion.div 
            className="card shadow-lg border-0 text-center py-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.95)' }}
          >
            <div className="card-body">
              <div className="mb-3 text-muted opacity-25">
                <FaCalendarCheck size={64} />
              </div>
              <h4 className="fw-bold text-secondary">{t('bookings.noBookings') || 'No bookings found'}</h4>
              <p className="text-muted mb-4">
                {filterStatus === 'all' 
                  ? (t('bookings.emptyState') || 'You don\'t have any bookings yet.')
                  : `${t('bookings.emptyStateFilter') || 'No bookings with status'} "${filterStatus}".`}
              </p>
              <Link to="/rooms" className="btn btn-primary px-4 py-2 rounded-pill" style={{ background: '#C9A961', border: 'none' }}>
                {t('bookings.searchRooms') || 'Search for Rooms'}
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="row g-4">
            <AnimatePresence>
              {filteredBookings.map((booking, index) => (
                <motion.div 
                    key={booking.id} 
                    className="col-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="card shadow-lg border-0 h-100" style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                    <div className="card-header border-0 pt-4 px-4 pb-0 bg-transparent d-flex justify-content-between align-items-start">
                        <div>
                            <h5 className="card-title mb-1 fw-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C' }}>
                                {booking.room?.roomNumber ? `${t('bookings.room') || 'Room'} ${booking.room.roomNumber}` : `#${booking.roomId}`}
                            </h5>
                            <div className="text-uppercase small fw-bold" style={{ color: '#C9A961', fontSize: '0.7rem', letterSpacing: '1px' }}>
                                {booking.room?.roomType}
                            </div>
                        </div>
                        <span 
                            className="badge rounded-pill text-uppercase" 
                            style={{ 
                                backgroundColor: `${getStatusColor(booking.status)}20`, 
                                color: getStatusColor(booking.status),
                                border: `1px solid ${getStatusColor(booking.status)}40`,
                                fontSize: '0.7rem',
                                padding: '0.5em 1em',
                                letterSpacing: '0.5px'
                            }}
                        >
                            {booking.status}
                        </span>
                    </div>
                    <div className="card-body px-4 pb-4 pt-3">
                      <hr style={{ borderColor: 'rgba(0,0,0,0.05)' }} />
                      
                      {(isManager || isReceptionist) && booking.user && (
                        <div className="d-flex align-items-center mb-3 p-2 rounded bg-light">
                          <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm me-3" style={{ width: '40px', height: '40px', color: '#C9A961' }}>
                            <FaUser />
                          </div>
                          <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{booking.user.firstName} {booking.user.lastName}</div>
                            <div className="text-muted small">{booking.user.email}</div>
                          </div>
                        </div>
                      )}

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                            <div className="p-2 rounded bg-light h-100">
                                <small className="d-block text-muted text-uppercase" style={{ fontSize: '0.65rem' }}>{t('bookings.checkIn') || 'Check-in'}</small>
                                <div className="fw-bold text-dark">{formatDate(booking.checkInDate)}</div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-2 rounded bg-light h-100">
                                <small className="d-block text-muted text-uppercase" style={{ fontSize: '0.65rem' }}>{t('bookings.checkOut') || 'Check-out'}</small>
                                <div className="fw-bold text-dark">{formatDate(booking.checkOutDate)}</div>
                            </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.9rem' }}>
                            <FaBed /> <span>{booking.numberOfGuests} {t('bookings.guests') || 'Guests'}</span>
                        </div>
                        <div className="text-end">
                            <small className="text-muted text-uppercase d-block" style={{ fontSize: '0.65rem' }}>{t('bookings.total') || 'Total'}</small>
                            <span className="fw-bold fs-5" style={{ color: '#C9A961' }}>${(booking.totalPrice || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      {booking.specialRequests && (
                        <div className="mb-3 p-2 rounded bg-warning bg-opacity-10 border border-warning border-opacity-25">
                          <small className="fw-bold text-warning text-opacity-75 text-uppercase d-block mb-1" style={{ fontSize: '0.65rem' }}>{t('bookings.specialRequests') || 'Special Requests'}</small>
                          <p className="mb-0 small text-dark" style={{ fontSize: '0.85rem' }}>{booking.specialRequests}</p>
                        </div>
                      )}

                      <div className="d-flex gap-2 mt-4 pt-2 border-top" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                        <Link
                          to={`/bookings/${booking.id}`}
                          className="btn btn-light btn-sm flex-grow-1 fw-bold"
                          style={{ color: '#6c757d' }}
                        >
                          {t('bookings.details') || 'Details'}
                        </Link>
                        
                        {isReceptionist ? (
                            <>
                                {booking.status.toLowerCase() === 'pending' && (
                                  <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(booking.id, 'Confirmed')} title={t('bookings.action.confirm') || 'Confirm'}>
                                    <FaCheck />
                                  </button>
                                )}
                                {(booking.status.toLowerCase() === 'confirmed' || booking.status.toLowerCase() === 'pending') && (
                                  <button className="btn btn-info btn-sm text-white" onClick={() => handleStatusUpdate(booking.id, 'CheckedIn')} title={t('bookings.action.checkIn') || 'Check In'}>
                                    <FaSignInAlt />
                                  </button>
                                )}
                                {booking.status.toLowerCase() === 'checkedin' && (
                                  <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(booking.id, 'CheckedOut')} title={t('bookings.action.checkOut') || 'Check Out'}>
                                    <FaSignOutAlt />
                                  </button>
                                )}
                            </>
                        ) : null}

                        {!isManager && booking.status.toLowerCase() !== 'cancelled' && 
                         booking.status.toLowerCase() !== 'checkedout' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            title={t('bookings.action.cancel') || 'Cancel Booking'}
                          >
                            {t('common.cancel') || 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsList;
