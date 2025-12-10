import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { serviceRequestsApi, ServiceRequest } from '../services/api';
import { bookingsApi, Booking } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FaConciergeBell, FaPlus, FaFilter, FaCalendarAlt, FaUser, FaClipboardList, FaCheck, FaPlay, FaTimesCircle, FaBed } from 'react-icons/fa';
import './Admin.css'; // Keep Admin styles for utility classes
import '../components/Home.css'; // Import Home styles for luxury theme
import LuxurySelect from '../components/common/LuxurySelect'; // Import LuxurySelect

const ServiceRequests: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isRoomAttendant, isManager, isReceptionist } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    bookingId: '',
    serviceType: '',
    description: '',
  });

  useEffect(() => {
    // Wait for auth state to be restored from localStorage
    if (isLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [requestsData, bookingsData] = await Promise.all([
          serviceRequestsApi.getAll(),
          bookingsApi.getAll(),
        ]);
        // Sort requests by newest first
        const sortedRequests = requestsData.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        setRequests(sortedRequests);
        
        setBookings(bookingsData.filter(b => 
          b.status.toLowerCase() === 'confirmed' || 
          b.status.toLowerCase() === 'checkedin' ||
          b.status.toLowerCase() === 'pending'
        ));
      } catch (err) {
        setError(t('services.loadError') || 'Failed to load service requests');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isLoading, navigate]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form data
    if (!formData.bookingId || formData.bookingId === '') {
      setError('Please select a booking');
      return;
    }

    if (!formData.serviceType || formData.serviceType === '') {
      setError('Please select a service type');
      return;
    }

    if (!formData.description || formData.description.trim() === '') {
      setError('Please enter a description');
      return;
    }

    try {
      console.log('Creating service request with data:', {
        bookingId: parseInt(formData.bookingId),
        serviceType: formData.serviceType,
        description: formData.description,
      });

      const newRequest = await serviceRequestsApi.create({
        bookingId: parseInt(formData.bookingId),
        serviceType: formData.serviceType,
        description: formData.description.trim(),
      });
      
      console.log('Service request created successfully:', newRequest);
      
      // Reload all requests to get the latest data from server
      const [requestsData] = await Promise.all([
        serviceRequestsApi.getAll(),
      ]);
      const sortedRequests = requestsData.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setRequests(sortedRequests);
      
      setShowCreateForm(false);
      setFormData({ bookingId: '', serviceType: '', description: '' });
      
      // Show success message
      alert('Service request created successfully!');
    } catch (err: any) {
      console.error('Failed to create service request:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          t('services.createError') || 
                          'Failed to create service request';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await serviceRequestsApi.updateStatus(id, status);
      setRequests(requests.map(r => 
        r.id === id ? { ...r, status } : r
      ));
    } catch (err) {
      alert(t('services.updateError') || 'Failed to update service request status');
    }
  };

  const filteredRequests = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status.toLowerCase() === filterStatus.toLowerCase());

  const getStatusBadgeStyle = (status: string | number) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower === 'completed' || statusLower === '2') return { bg: '#28a745', color: 'white', icon: <FaCheck /> };
    if (statusLower === 'inprogress' || statusLower === '1') return { bg: '#17a2b8', color: 'white', icon: <FaPlay /> };
    if (statusLower === 'pending' || statusLower === '0') return { bg: '#ffc107', color: 'black', icon: <FaConciergeBell /> };
    if (statusLower === 'cancelled' || statusLower === '3') return { bg: '#dc3545', color: 'white', icon: <FaTimesCircle /> };
    return { bg: '#6c757d', color: 'white', icon: null };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
      return <LoadingSpinner text={t('auth.authenticating') || "Authenticating..."} />;
  }

  if (!isAuthenticated || isManager) {
    if (isManager) {
       navigate('/dashboard'); // Or wherever managers should go if they try to access this
       return null;
    }
    return null;
  }

  if (loading) {
    return <LoadingSpinner text={t('services.loading') || "Loading Service Requests..."} />;
  }

  return (
    <div className="home-container" style={{ paddingTop: '2rem', paddingBottom: '4rem', minHeight: '100vh', background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 100%)' }}>
      <div className="container">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="d-flex justify-content-end align-items-center mb-4"
        >
          {!isRoomAttendant && !isManager && (
            <button
              className="btn btn-primary py-2 px-4 fw-bold text-uppercase d-flex align-items-center gap-2"
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{ 
                  background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', 
                  border: 'none',
                  borderRadius: '12px',
                  letterSpacing: '1px',
                  boxShadow: '0 4px 15px rgba(201, 169, 97, 0.3)'
              }}
            >
              {showCreateForm ? <><FaTimesCircle /> {t('common.cancel') || 'Cancel'}</> : <><FaPlus /> {t('services.newRequest') || 'New Request'}</>}
            </button>
          )}
        </motion.div>

        {showCreateForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', transitionEnd: { overflow: 'visible' } }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="card shadow-lg border-0 mb-5"
            style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}
          >
            <div className="card-body p-4">
              <h4 className="card-title mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C' }}>{t('services.createNew') || 'Create New Request'}</h4>
              <form onSubmit={handleCreateRequest}>
                {error && <div className="alert alert-danger">{error}</div>}
                
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="bookingId" className="form-label fw-bold text-uppercase small text-muted">{t('services.booking') || 'Booking'}</label>
                        <LuxurySelect
                          value={formData.bookingId}
                          onChange={(value) => setFormData({ ...formData, bookingId: value })}
                          placeholder={t('services.selectBooking') || 'Select a booking'}
                          options={[
                            { value: '', label: t('services.selectBooking') || 'Select a booking' },
                            ...bookings.map((booking) => ({
                              value: booking.id,
                              label: `${t('services.room') || 'Room'} ${booking.room?.roomNumber} (${new Date(booking.checkInDate).toLocaleDateString()} - ${new Date(booking.checkOutDate).toLocaleDateString()})`
                            }))
                          ]}
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label htmlFor="serviceType" className="form-label fw-bold text-uppercase small text-muted">{t('services.serviceType') || 'Service Type'}</label>
                        <LuxurySelect
                          value={formData.serviceType}
                          onChange={(value) => setFormData({ ...formData, serviceType: value })}
                          placeholder={t('services.selectServiceType') || 'Select service type'}
                          options={[
                            { value: '', label: t('services.selectServiceType') || 'Select service type' },
                            { value: 'RoomService', label: t('services.type.roomService') || 'Room Service' },
                            { value: 'Housekeeping', label: t('services.type.housekeeping') || 'Housekeeping' },
                            { value: 'Maintenance', label: t('services.type.maintenance') || 'Maintenance' },
                            { value: 'Laundry', label: t('services.type.laundry') || 'Laundry' },
                            { value: 'Other', label: t('services.type.other') || 'Other' },
                          ]}
                        />
                    </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="description" className="form-label fw-bold text-uppercase small text-muted">{t('services.description') || 'Description'}</label>
                  <textarea
                    className="form-control bg-light border-0 p-3"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder={t('services.descriptionPlaceholder') || "Please describe your request in detail..."}
                    style={{ borderRadius: '12px' }}
                  />
                </div>

                <div className="d-flex justify-content-end">
                    <button 
                        type="submit" 
                        className="btn btn-primary py-2 px-5 fw-bold text-uppercase"
                        style={{ 
                            background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', 
                            border: 'none',
                            borderRadius: '12px',
                            letterSpacing: '1px'
                        }}
                    >
                        {t('services.submit') || 'Submit Request'}
                    </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {(isRoomAttendant || isManager || isReceptionist) && (
          <motion.div 
            className="card shadow-lg border-0 mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', overflow: 'visible', zIndex: 10 }}
          >
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-md-3">
                  <label className="form-label fw-bold text-uppercase small text-muted"><FaFilter className="me-2" />{t('services.filterStatus') || 'Filter by Status'}</label>
                  <LuxurySelect
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={[
                      { value: 'all', label: t('services.status.all') || 'All Statuses' },
                      { value: 'pending', label: t('services.status.pending') || 'Pending' },
                      { value: 'inprogress', label: t('services.status.inProgress') || 'In Progress' },
                      { value: 'completed', label: t('services.status.completed') || 'Completed' },
                      { value: 'cancelled', label: t('services.status.cancelled') || 'Cancelled' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {filteredRequests.length === 0 ? (
          <motion.div 
            className="card shadow-lg border-0 text-center py-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ borderRadius: '16px', background: 'rgba(255, 255, 255, 0.95)' }}
          >
            <div className="card-body">
              <div className="mb-3 text-muted opacity-25">
                <FaConciergeBell size={64} />
              </div>
              <h4 className="fw-bold text-secondary">{t('services.noRequests') || 'No service requests found'}</h4>
              <p className="text-muted mb-0">
                {filterStatus === 'all'
                  ? (t('services.emptyState') || 'You don\'t have any service requests yet.')
                  : `${t('services.emptyStateFilter') || 'No requests with status'} "${filterStatus}".`}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="row g-4">
            <AnimatePresence>
              {filteredRequests.map((request, index) => {
                  const statusStyle = getStatusBadgeStyle(request.status);
                  return (
                    <motion.div 
                        key={request.id} 
                        className="col-md-6 col-lg-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                    <div className="card shadow-lg border-0 h-100" style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                        <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 className="card-title mb-1 fw-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C' }}>
                                    {request.serviceType}
                                </h5>
                                {request.booking && (
                                    <div className="d-flex align-items-center gap-2 text-muted small">
                                        <FaBed style={{ color: '#C9A961' }} />
                                        <span className="text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                            {t('services.room') || 'Room'} {request.booking.room?.roomNumber}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <span 
                                className="badge rounded-pill d-flex align-items-center gap-1 shadow-sm" 
                                style={{ 
                                    backgroundColor: statusStyle.bg, 
                                    color: statusStyle.color,
                                    fontSize: '0.7rem',
                                    padding: '0.5em 1em',
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {statusStyle.icon} {request.status}
                            </span>
                        </div>

                        <div className="p-3 rounded bg-light mb-3 border border-light">
                            <p className="card-text mb-0" style={{ fontSize: '0.95rem', color: '#4a4a4a' }}>
                                <FaClipboardList className="me-2 text-muted" />
                                {request.description}
                            </p>
                        </div>

                        <div className="d-flex justify-content-between align-items-end">
                            <div className="text-muted small" style={{ fontSize: '0.8rem' }}>
                                <div className="mb-1">
                                    <FaCalendarAlt className="me-1" style={{ opacity: 0.5 }} /> 
                                    {t('services.requested') || 'Requested:'} <strong>{formatDate(request.requestedAt)}</strong>
                                </div>
                                {request.completedAt && (
                                    <div className="text-success">
                                        <FaCheck className="me-1" /> 
                                        {t('services.completed') || 'Completed:'} <strong>{formatDate(request.completedAt)}</strong>
                                    </div>
                                )}
                                {(isRoomAttendant || isManager) && request.user && (
                                    <div className="mt-1 pt-1 border-top">
                                        <FaUser className="me-1" style={{ opacity: 0.5 }} />
                                        {t('services.guest') || 'Guest:'} {request.user.firstName} {request.user.lastName}
                                    </div>
                                )}
                            </div>
                        </div>

                        {(isRoomAttendant || isManager || isReceptionist) && (
                            <div className="mt-3 pt-3 border-top d-flex gap-2 justify-content-end">
                                {request.status.toLowerCase() === 'pending' && (isManager || isReceptionist) && (
                                    <button
                                        className="btn btn-info btn-sm text-white fw-bold"
                                        onClick={() => handleStatusUpdate(request.id, 'InProgress')}
                                    >
                                        {t('services.action.assign') || 'Assign'}
                                    </button>
                                )}
                                {request.status.toLowerCase() === 'inprogress' && (isRoomAttendant || isManager) && (
                                    <button
                                        className="btn btn-success btn-sm fw-bold"
                                        onClick={() => handleStatusUpdate(request.id, 'Completed')}
                                    >
                                        {t('services.action.complete') || 'Complete'}
                                    </button>
                                )}
                            </div>
                        )}
                        </div>
                    </div>
                    </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceRequests;
