import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { bookingsApi, bookingsApiExtended, Booking, paymentApi, Payment, CreatePaymentData } from '../services/api';
import { roomsApi, Room } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FeedbackModal, { FeedbackModalProps } from '../components/common/FeedbackModal';
import LuxurySelect from '../components/common/LuxurySelect';
import { motion } from 'framer-motion';
import { FaBed, FaCalendarAlt, FaUser, FaEnvelope, FaWifi, FaTv, FaSnowflake, FaWind, FaArrowLeft, FaCreditCard, FaDollarSign, FaPlus } from 'react-icons/fa';
import './BookingDetails.css';

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isManager, isReceptionist, isCustomer } = useAuth();
  const { t } = useLanguage();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<CreatePaymentData>({
    bookingId: 0,
    amount: 0,
    paymentMethod: 'CreditCard',
    transactionId: '',
  });
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalProps>({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
    onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
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

    const fetchBooking = async () => {
      try {
        if (!id) return;
        const bookingData = await bookingsApi.getById(parseInt(id));
        setBooking(bookingData);
        
        // Fetch payments for this booking
        try {
          const paymentsData = await paymentApi.getByBooking(parseInt(id));
          setPayments(paymentsData);
          
          // Set payment form data if booking is loaded and user is Receptionist
          if (bookingData && isReceptionist) {
            const totalPaid = paymentsData
              .filter(p => p.status === 'Paid')
              .reduce((sum, p) => sum + p.amount, 0);
            const remaining = (bookingData.totalPrice || bookingData.totalAmount || 0) - totalPaid;
            
            setPaymentFormData({
              bookingId: bookingData.id,
              amount: remaining > 0 ? remaining : 0,
              paymentMethod: 'CreditCard',
              transactionId: '',
            });
          }
        } catch (err) {
          console.error('Failed to load payments:', err);
          // If user doesn't have permission, just continue without payments
        }
        
        // Fetch room details if not included
        if (bookingData.roomId && !bookingData.room) {
          try {
            const roomData = await roomsApi.getById(bookingData.roomId);
            setRoom(roomData);
          } catch (err) {
            console.error('Failed to load room details:', err);
          }
        } else if (bookingData.room) {
          // If room is included but incomplete, fetch full details
          try {
            const roomData = await roomsApi.getById(bookingData.room.id);
            setRoom(roomData);
          } catch (err) {
            console.error('Failed to load room details:', err);
          }
        }
      } catch (err) {
        setError(t('bookings.loadDetailsError') || 'Failed to load booking details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, isAuthenticated, navigate, isLoading]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;
    
    // Check payment status before Check In
    if (newStatus === 'CheckedIn') {
      const totalPaid = payments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.amount, 0);
      const totalPrice = booking.totalPrice || booking.totalAmount || 0;
      const remaining = totalPrice - totalPaid;
      
      if (remaining > 0) {
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: t('payment.required') || 'Payment Required',
          message: (t('payment.requiredMessage') || 'Please record payment before checking in. Remaining amount: ${amount}').replace('${amount}', `$${remaining.toFixed(2)}`),
          onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
        });
        return;
      }
    }
    
    const confirmMessage = (t('bookings.statusUpdateConfirm') || 'Are you sure you want to update status to "{status}"?').replace('{status}', newStatus);
    setFeedbackModal({
      isOpen: true,
      type: 'confirm',
      title: t('common.confirm') || 'Confirm',
      message: confirmMessage,
      onConfirm: async () => {
        try {
          if (newStatus === 'CheckedIn') {
            await bookingsApiExtended.checkIn(booking.id);
          } else {
            await bookingsApi.updateStatus(booking.id, newStatus);
          }
          const updatedBooking = await bookingsApi.getById(booking.id);
          setBooking(updatedBooking);
          setFeedbackModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          setFeedbackModal({
            isOpen: true,
            type: 'error',
            title: t('common.error') || 'Error',
            message: err.response?.data?.message || (t('bookings.updateError') || 'Failed to update booking status'),
            onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
          });
        }
      },
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
    });
    return;

  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    
    try {
      await paymentApi.record({
        ...paymentFormData,
        bookingId: booking.id,
      });
      
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: t('payment.recorded') || 'Payment Recorded',
        message: t('payment.recordedSuccess') || 'Payment has been recorded successfully. The booking payment status has been updated.',
        onClose: () => {
          setFeedbackModal(prev => ({ ...prev, isOpen: false }));
          setShowPaymentForm(false);
          // Reload booking and payments
          const fetchData = async () => {
            const bookingData = await bookingsApi.getById(booking.id);
            setBooking(bookingData);
            const paymentsData = await paymentApi.getByBooking(booking.id);
            setPayments(paymentsData);
          };
          fetchData();
        },
      });
    } catch (err: any) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: t('payment.error') || 'Payment Error',
        message: err.response?.data?.message || (t('payment.recordError') || 'Failed to record payment'),
        onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
      });
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    
    setFeedbackModal({
      isOpen: true,
      type: 'confirm',
      title: t('common.confirm') || 'Confirm',
      message: t('bookings.cancelConfirm') || 'Are you sure you want to cancel this booking?',
      onConfirm: async () => {
        try {
          await bookingsApi.cancel(booking.id);
          navigate('/bookings');
        } catch (err) {
          setFeedbackModal({
            isOpen: true,
            type: 'error',
            title: t('common.error') || 'Error',
            message: t('bookings.cancelError') || 'Failed to cancel booking',
            onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
          });
        }
      },
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const nights = Math.ceil(
      (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    return nights > 0 ? nights : 0;
  };

  if (!isAuthenticated) {
    return null;
  }

      if (loading) {
    return <LoadingSpinner text={t('bookings.loading') || 'Loading Booking Details...'} />;
  }

  if (error || !booking) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          {error || (t('bookings.notFound') || 'Booking not found')}
        </div>
        <Link to="/bookings" className="btn btn-primary">
          {t('bookings.backToBookings') || 'Back to Bookings'}
        </Link>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    return `luxury-badge ${status.toLowerCase()}`;
  };

  return (
    <div className="booking-details-container" style={{ paddingTop: '2rem', paddingBottom: '4rem', minHeight: '100vh', background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 100%)' }}>
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/bookings" className="back-link">
            <FaArrowLeft /> {t('bookings.backToBookings') || 'Back to Bookings'}
          </Link>
        </motion.div>

        <div className="row">
          <motion.div 
            className="col-12"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="booking-details-card">
              <div className="booking-details-header">
                <div className="d-flex align-items-center gap-3">
                  <h4 className="booking-details-title">{t('bookings.bookingDetails') || 'Booking Details'}</h4>
                  <span className={getStatusBadgeClass(booking.status)}>
                    {booking.status}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  {isReceptionist && booking.status.toLowerCase() === 'pending' && (
                    <>
                      <button className="btn-luxury-primary-small" onClick={() => handleStatusUpdate('Confirmed')}>{t('bookings.confirm') || 'Confirm'}</button>
                      <button className="btn-luxury-outline-small" onClick={() => handleStatusUpdate('CheckedIn')}>{t('bookings.checkInBtn') || 'Check In'}</button>
                    </>
                  )}
                  {isReceptionist && booking.status.toLowerCase() === 'confirmed' && (
                    <button className="btn-luxury-primary-small" onClick={() => handleStatusUpdate('CheckedIn')}>{t('bookings.checkInBtn') || 'Check In'}</button>
                  )}
                  {isReceptionist && booking.status.toLowerCase() === 'checkedin' && (
                    <button className="btn-luxury-primary-small" onClick={() => handleStatusUpdate('CheckedOut')}>{t('bookings.checkOutBtn') || 'Check Out'}</button>
                  )}
                  {!isManager && booking.status.toLowerCase() !== 'cancelled' && booking.status.toLowerCase() !== 'checkedout' && (
                    <button className="btn-luxury-danger-small" onClick={handleCancel}>{t('bookings.cancelBooking') || 'Cancel Booking'}</button>
                  )}
                  {room && (
                    <Link to={`/rooms/${room.id}`} className="btn-luxury-outline-small">{t('bookings.viewRoom') || 'View Room'}</Link>
                  )}
                </div>
              </div>
              <div className="card-body p-4">
                {/* Horizontal Key Stats Row */}
                <div className="key-stats-row mb-5">
                  <div className="stat-item">
                    <span className="stat-label">{t('bookings.checkIn') || 'Check-in'}</span>
                    <span className="stat-value">{formatDate(booking.checkInDate)}</span>
                    {booking.actualCheckInDate && <small className="text-success">{t('bookings.actual') || 'Actual'}: {formatTime(booking.actualCheckInDate)}</small>}
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-label">{t('bookings.checkOut') || 'Check-out'}</span>
                    <span className="stat-value">{formatDate(booking.checkOutDate)}</span>
                    {booking.actualCheckOutDate && <small className="text-muted">{t('bookings.actual') || 'Actual'}: {formatTime(booking.actualCheckOutDate)}</small>}
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-label">{t('bookings.guests') || 'Guests'}</span>
                    <span className="stat-value">{booking.numberOfGuests} {t('bookings.adults') || 'Adults'}</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-label">{t('bookings.nights') || 'Nights'}</span>
                    <span className="stat-value">{calculateNights()}</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-label">{t('bookings.total') || 'Total'}</span>
                    <span className="stat-value" style={{ color: '#C9A961' }}>${(booking.totalPrice || booking.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <h5 className="booking-section-title"><FaBed /> {t('bookings.roomInformation') || 'Room Information'}</h5>
                    <div className="info-grid-horizontal">
                      <div className="info-item-horizontal">
                        <span className="info-label">{t('bookings.roomNumber') || 'Room Number'}</span>
                        <span className="info-value">{booking.room?.roomNumber || `#${booking.roomId}`}</span>
                      </div>
                      <div className="info-item-horizontal">
                        <span className="info-label">{t('bookings.roomType') || 'Room Type'}</span>
                        <span className="info-value">{booking.room?.roomType || 'N/A'}</span>
                      </div>
                      {room && (
                        <>
                          <div className="info-item-horizontal">
                            <span className="info-label">{t('bookings.pricePerNight') || 'Price per Night'}</span>
                            <span className="info-value">${room.pricePerNight.toFixed(2)}</span>
                          </div>
                          <div className="info-item-horizontal">
                            <span className="info-label">{t('bookings.capacity') || 'Capacity'}</span>
                            <span className="info-value">{room.capacity} {t('bookings.guestsLabel') || 'guests'}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {room && (
                      <div className="mt-4">
                        <h6 className="info-label mb-3">{t('bookings.roomAmenities') || 'Room Amenities'}</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {room.hasWifi && <span className="amenity-badge"><FaWifi /> WiFi</span>}
                          {room.hasTV && <span className="amenity-badge"><FaTv /> TV</span>}
                          {room.hasAirConditioning && <span className="amenity-badge"><FaSnowflake /> AC</span>}
                          {room.hasBalcony && <span className="amenity-badge"><FaWind /> Balcony</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 border-start-md ps-md-5">
                    <h5 className="booking-section-title"><FaUser /> {t('bookings.guestRequests') || 'Guest & Requests'}</h5>
                    {booking.user && (
                      <div className="info-grid-horizontal mb-4">
                        <div className="info-item-horizontal">
                          <span className="info-label">{t('bookings.fullName') || 'Full Name'}</span>
                          <span className="info-value">{booking.user.firstName} {booking.user.lastName}</span>
                        </div>
                        <div className="info-item-horizontal">
                          <span className="info-label">{t('bookings.emailAddress') || 'Email Address'}</span>
                          <span className="info-value">{booking.user.email}</span>
                        </div>
                      </div>
                    )}

                    <div className="special-requests-box">
                      <h6 className="info-label mb-2"><FaEnvelope className="me-2" /> {t('bookings.specialRequests') || 'Special Requests'}</h6>
                      <p className="text-muted mb-0 fst-italic">
                        {booking.specialRequests ? `"${booking.specialRequests}"` : (t('bookings.noSpecialRequests') || 'No special requests.')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Information Section */}
                {(isManager || isReceptionist || isCustomer || payments.length > 0) && (
                  <div className="row mt-4">
                    <div className="col-12">
                      <h5 className="booking-section-title"><FaCreditCard /> {t('payment.information') || 'Payment Information'}</h5>
                      <div className="info-grid-horizontal mb-3">
                        <div className="info-item-horizontal">
                          <span className="info-label">{t('payment.status') || 'Payment Status'}</span>
                          <span className={`info-value badge ${
                            booking.paymentStatus === 'Paid' ? 'bg-success' :
                            booking.paymentStatus === 'Pending' ? 'bg-warning text-dark' :
                            'bg-danger'
                          }`}>
                            {booking.paymentStatus || 'Pending'}
                          </span>
                        </div>
                        <div className="info-item-horizontal">
                          <span className="info-label">{t('payment.totalAmount') || 'Total Amount'}</span>
                          <span className="info-value" style={{ color: '#C9A961', fontWeight: 600 }}>
                            ${(booking.totalPrice || booking.totalAmount || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="info-item-horizontal">
                          <span className="info-label">{t('payment.paidAmount') || 'Paid Amount'}</span>
                          <span className="info-value" style={{ color: '#28a745', fontWeight: 600 }}>
                            ${payments
                              .filter(p => p.status === 'Paid')
                              .reduce((sum, p) => sum + p.amount, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                        <div className="info-item-horizontal">
                          <span className="info-label">Remaining</span>
                          <span className="info-value" style={{ 
                            color: (booking.totalPrice || booking.totalAmount || 0) - 
                                   payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0) > 0 
                                   ? '#dc3545' : '#28a745',
                            fontWeight: 600 
                          }}>
                            ${((booking.totalPrice || booking.totalAmount || 0) - 
                                payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0))
                                .toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {payments.length > 0 && (
                        <div className="mt-3">
                          <h6 className="info-label mb-3">{t('payment.history') || 'Payment History'}</h6>
                          <div className="table-responsive">
                            <table className="table table-sm" style={{ background: '#F5F1E8', borderRadius: '8px' }}>
                              <thead>
                                <tr>
                                  <th>{t('payment.date') || 'Date'}</th>
                                  <th>{t('payment.amount') || 'Amount'}</th>
                                  <th>{t('payment.method') || 'Method'}</th>
                                  <th>{t('payment.status') || 'Status'}</th>
                                  <th>{t('payment.transactionId') || 'Transaction ID'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {payments.map((payment) => (
                                  <tr key={payment.id}>
                                    <td>{new Date(payment.transactionDate).toLocaleDateString()}</td>
                                    <td className="fw-bold">${payment.amount.toFixed(2)}</td>
                                    <td>{payment.paymentMethod}</td>
                                    <td>
                                      <span className={`badge ${
                                        payment.status === 'Paid' ? 'bg-success' :
                                        payment.status === 'Pending' ? 'bg-warning text-dark' :
                                        'bg-danger'
                                      }`}>
                                        {payment.status}
                                      </span>
                                    </td>
                                    <td className="text-muted small">{payment.transactionId || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Receptionist Payment Form */}
                      {isReceptionist && booking && (() => {
                        const totalPaid = payments
                          .filter(p => p.status === 'Paid')
                          .reduce((sum, p) => sum + p.amount, 0);
                        const remaining = (booking.totalPrice || booking.totalAmount || 0) - totalPaid;
                        const needsPayment = remaining > 0;

                        if (!needsPayment) return null;

                        return (
                          <div className="mt-4">
                            {!showPaymentForm ? (
                              <button
                                className="btn btn-primary w-100"
                                onClick={() => {
                                  setPaymentFormData({
                                    bookingId: booking.id,
                                    amount: remaining,
                                    paymentMethod: 'CreditCard',
                                    transactionId: '',
                                  });
                                  setShowPaymentForm(true);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)',
                                  border: 'none',
                                  borderRadius: '12px',
                                  padding: '0.75rem 1.5rem',
                                  fontWeight: 600,
                                }}
                              >
                                <FaCreditCard className="me-2" />
                                {t('payment.recordPayment') || 'Record Payment'} (${remaining.toFixed(2)} {t('payment.remainingLabel') || 'remaining'})
                              </button>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="card border-0 shadow-sm mt-3"
                                style={{ borderRadius: '12px', background: '#F5F1E8' }}
                              >
                                <div className="card-body p-4">
                                  <h6 className="mb-3" style={{ color: '#8B6F47', fontFamily: 'Playfair Display, serif' }}>
                                    {t('payment.recordNewPayment') || 'Record New Payment'}
                                  </h6>
                                  <form onSubmit={handleRecordPayment}>
                                    <div className="mb-3">
                                      <label className="form-label small text-uppercase fw-bold text-muted">
                                        {t('payment.paymentMethod') || 'Payment Method'}
                                      </label>
                                      <LuxurySelect
                                        value={paymentFormData.paymentMethod}
                                        onChange={(value) => setPaymentFormData({ ...paymentFormData, paymentMethod: value })}
                                        options={[
                                          { value: 'CreditCard', label: t('payment.method.creditCard') || 'Credit Card' },
                                          { value: 'DebitCard', label: t('payment.method.debitCard') || 'Debit Card' },
                                          { value: 'Cash', label: t('payment.method.cash') || 'Cash' },
                                          { value: 'BankTransfer', label: t('payment.method.bankTransfer') || 'Bank Transfer' },
                                          { value: 'PayPal', label: t('payment.method.paypal') || 'PayPal' },
                                          { value: 'Other', label: t('payment.method.other') || 'Other' },
                                        ]}
                                      />
                                    </div>
                                    <div className="mb-3">
                                      <label className="form-label small text-uppercase fw-bold text-muted">
                                        {t('payment.amount') || 'Amount'} ($)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={remaining}
                                        className="form-control"
                                        value={paymentFormData.amount || ''}
                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) || 0 })}
                                        required
                                        style={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                                      />
                                      <small className="text-muted">{t('payment.remainingLabel') || 'Remaining'}: ${remaining.toFixed(2)}</small>
                                    </div>
                                    <div className="mb-3">
                                      <label className="form-label small text-uppercase fw-bold text-muted">
                                        {t('payment.transactionIdOptional') || 'Transaction ID (Optional)'}
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={paymentFormData.transactionId || ''}
                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, transactionId: e.target.value })}
                                        placeholder={t('payment.transactionIdPlaceholder') || 'Enter transaction ID if available'}
                                        style={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                                      />
                                    </div>
                                    <div className="d-flex gap-2">
                                      <button
                                        type="button"
                                        className="btn btn-light flex-fill"
                                        onClick={() => setShowPaymentForm(false)}
                                        style={{ borderRadius: '8px' }}
                                      >
                                        {t('common.cancel') || 'Cancel'}
                                      </button>
                                      <button
                                        type="submit"
                                        className="btn btn-primary flex-fill"
                                        style={{
                                          background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)',
                                          border: 'none',
                                          borderRadius: '8px',
                                        }}
                                      >
                                        {t('payment.recordPayment') || 'Record Payment'}
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <FeedbackModal {...feedbackModal} />
    </div>
  );
};

export default BookingDetails;

