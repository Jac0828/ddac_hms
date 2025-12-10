import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { roomsApi, bookingsApi, Room } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ImageGallery from '../components/common/ImageGallery';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { FaCalendarAlt, FaUserFriends, FaPen, FaConciergeBell, FaInfoCircle, FaMoneyBillWave, FaBed, FaTag } from 'react-icons/fa';
import './Admin.css'; // Keep Admin styles for some layout basics
import '../components/Home.css'; // Import Home styles for luxury theme and calendar

const CreateBooking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSettings();
  
  const roomIdParam = searchParams.get('roomId');
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');

  const [room, setRoom] = useState<Room | null>(null);
  // State for Date objects
  const [checkInDate, setCheckInDate] = useState<Date | null>(
    checkInParam ? new Date(checkInParam) : new Date()
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(
    checkOutParam ? new Date(checkOutParam) : (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    })()
  );

  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(!!roomIdParam);

  useEffect(() => {
    // Wait for auth state to be restored from localStorage
    if (isLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load room if roomId is provided
    if (roomIdParam) {
      const fetchRoom = async () => {
        try {
          const data = await roomsApi.getById(parseInt(roomIdParam));
          setRoom(data);
          setNumberOfGuests(Math.min(data.capacity, 2));
        } catch (err) {
          setError(t('rooms.error') || 'Failed to load room details');
        } finally {
          setLoadingRoom(false);
        }
      };
      fetchRoom();
    }
  }, [roomIdParam, isAuthenticated, isLoading, navigate]);

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const getDiscountMultiplier = (tier?: string) => {
    const discounts = settings || { 
        memberDiscount: 10, silverDiscount: 15, goldDiscount: 20, platinumDiscount: 25
    };
    
    let discountPercent = discounts.memberDiscount;
    if (tier === 'Silver') discountPercent = discounts.silverDiscount;
    if (tier === 'Gold') discountPercent = discounts.goldDiscount;
    if (tier === 'Platinum') discountPercent = discounts.platinumDiscount;
    
    // Only apply discount if email is confirmed
    if (user && !user.emailConfirmed) return 1;

    return 1 - (discountPercent / 100);
  };

  const calculateStandardTotal = () => {
    if (!room) return 0;
    return room.pricePerNight * calculateNights();
  };

  const calculateMemberTotal = () => {
    if (!room) return 0;
    const multiplier = getDiscountMultiplier(user?.membershipTier);
    return room.pricePerNight * calculateNights() * multiplier;
  };

  const calculateTotal = () => {
    // Return member price if user is a verified member, otherwise standard price
    if (user && user.emailConfirmed && user.membershipTier) {
      return calculateMemberTotal();
    }
    return calculateStandardTotal();
  };

  const isMember = user && user.emailConfirmed && user.membershipTier;
  const standardTotal = calculateStandardTotal();
  const memberTotal = calculateMemberTotal();
  const discountAmount = standardTotal - memberTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!room) {
      setError(t('booking.selectRoom') || 'Please select a room');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      setError(t('availability.selectDates') || 'Please select check-in and check-out dates');
      return;
    }

    if (numberOfGuests > room.capacity) {
      setError(`${t('booking.maxGuestsError') || 'This room can only accommodate'} ${room.capacity} ${t('booking.guests') || 'guests'}`);
      return;
    }

    if (checkOutDate <= checkInDate) {
      setError(t('availability.invalidDates') || 'Check-out date must be after check-in date');
      return;
    }

    setLoading(true);

    try {
      await bookingsApi.create({
        roomId: room.id,
        checkInDate: format(checkInDate, 'yyyy-MM-dd'),
        checkOutDate: format(checkOutDate, 'yyyy-MM-dd'),
        numberOfGuests,
        specialRequests: specialRequests.trim() || undefined,
      });
      
      navigate('/bookings?success=true');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(t('auth.sessionExpired') || 'Session expired. Redirecting to login...');
        setTimeout(() => {
             localStorage.removeItem('jwtToken');
             localStorage.removeItem('user');
             navigate('/login');
        }, 1500);
      } else {
        setError(err.response?.data?.message || t('booking.createError') || 'Failed to create booking. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
      return <LoadingSpinner text={t('auth.authenticating') || "Authenticating..."} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loadingRoom) {
    return <LoadingSpinner text={t('rooms.loadingDetails') || "Loading room details..."} />;
  }

  return (
    <div className="home-container" style={{ paddingTop: '2rem', paddingBottom: '4rem', background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 100%)' }}>
      <div className="container">
        <div className="row g-4">
          {/* Booking Form Column */}
          <div className="col-lg-7">
            <motion.div 
                className="card shadow-lg border-0 h-100" 
                style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                <h4 className="mb-0" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaCalendarAlt style={{ color: '#C9A961' }} /> {t('booking.details') || 'Booking Details'}
                </h4>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="alert alert-danger d-flex align-items-center gap-2"
                    >
                        <FaInfoCircle /> {error}
                    </motion.div>
                  )}

                  {!room && (
                    <div className="alert alert-info">
                      <Link to="/check-availability" className="btn btn-primary btn-sm">
                        {t('booking.searchAvailable') || 'Search for Available Rooms'}
                      </Link>
                    </div>
                  )}

                  <div className="row mb-4">
                    <div className="col-md-6 mb-3 mb-md-0">
                      <label className="form-label fw-bold text-uppercase small text-muted">{t('booking.checkIn') || 'Check-in Date'}</label>
                      <div className="luxury-calendar">
                        <DatePicker
                            selected={checkInDate}
                            onChange={(date: Date) => setCheckInDate(date)}
                            selectsStart
                            startDate={checkInDate}
                            endDate={checkOutDate}
                            minDate={new Date()}
                            dateFormat="MMM d, yyyy"
                            className="form-control border-0 bg-light p-3 fw-bold"
                            wrapperClassName="w-100"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-uppercase small text-muted">{t('booking.checkOut') || 'Check-out Date'}</label>
                      <div className="luxury-calendar">
                        <DatePicker
                            selected={checkOutDate}
                            onChange={(date: Date) => setCheckOutDate(date)}
                            selectsEnd
                            startDate={checkInDate}
                            endDate={checkOutDate}
                            minDate={checkInDate || new Date()}
                            dateFormat="MMM d, yyyy"
                            className="form-control border-0 bg-light p-3 fw-bold"
                            wrapperClassName="w-100"
                        />
                      </div>
                    </div>
                  </div>

                  {room && (
                    <div className="mb-4">
                      <label className="form-label fw-bold text-uppercase small text-muted">
                        <FaUserFriends className="me-2" style={{ color: '#C9A961' }} />
                        {t('booking.guests') || 'Guests'} (Max: {room.capacity})
                      </label>
                      <div className="input-group">
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary"
                            onClick={() => setNumberOfGuests(prev => Math.max(1, prev - 1))}
                        >
                            -
                        </button>
                        <input
                            type="number"
                            className="form-control text-center fw-bold border-secondary"
                            value={numberOfGuests}
                            readOnly
                        />
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary"
                            onClick={() => setNumberOfGuests(prev => Math.min(room.capacity, prev + 1))}
                        >
                            +
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="form-label fw-bold text-uppercase small text-muted">
                        <FaConciergeBell className="me-2" style={{ color: '#C9A961' }} />
                        {t('booking.specialRequests') || 'Special Requests'}
                    </label>
                    <textarea
                      className="form-control bg-light border-0"
                      rows={4}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder={t('booking.specialRequestsPlaceholder') || "Any special requests, dietary restrictions, or notes for our staff..."}
                      style={{ borderRadius: '12px', padding: '1rem' }}
                    />
                  </div>

                  <div className="d-flex gap-3 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary py-3 px-4 flex-grow-1 fw-bold text-uppercase"
                      style={{ 
                          background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', 
                          border: 'none',
                          borderRadius: '12px',
                          letterSpacing: '1px',
                          boxShadow: '0 4px 15px rgba(201, 169, 97, 0.3)'
                      }}
                      disabled={loading || !room}
                    >
                      {loading ? (
                          <><span className="spinner-border spinner-border-sm me-2"/> {t('common.processing') || 'Processing...'}</>
                      ) : (
                          t('booking.confirm') || 'Confirm Booking'
                      )}
                    </button>
                    <Link 
                        to="/rooms" 
                        className="btn btn-light py-3 px-4 fw-bold text-uppercase"
                        style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    >
                      {t('common.cancel') || 'Cancel'}
                    </Link>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Booking Summary Column */}
          <div className="col-lg-5">
            <motion.div 
                className="card shadow-lg border-0 sticky-top" 
                style={{ borderRadius: '16px', top: '6rem', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                <h4 className="mb-0" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaMoneyBillWave style={{ color: '#C9A961' }} /> {t('booking.summary') || 'Summary'}
                </h4>
              </div>
              <div className="card-body p-4">
                {room ? (
                  <>
                    {room.imageUrls && room.imageUrls.length > 0 ? (
                        <div className="mb-4 rounded-3 overflow-hidden shadow-sm" style={{ height: '220px' }}>
                            <ImageGallery 
                                images={room.imageUrls} 
                                height="100%" 
                                showThumbnails={false}
                                allowFullscreen={true} 
                            />
                        </div>
                    ) : (
                        <div className="mb-4 rounded-3 bg-light d-flex align-items-center justify-content-center text-muted" style={{ height: '200px' }}>
                            <FaBed size={48} opacity={0.3} />
                        </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom" style={{ borderColor: 'rgba(201, 169, 97, 0.2)' }}>
                        <div>
                            <h5 className="mb-1 fw-bold" style={{ color: '#2C2C2C' }}>{t('booking.room') || 'Room'} {room.roomNumber}</h5>
                            <div className="badge bg-dark text-gold text-uppercase" style={{ color: '#C9A961' }}>{room.roomType}</div>
                        </div>
                        <div className="text-end">
                            {isMember ? (
                                <>
                                    <div className="fs-5 fw-bold text-decoration-line-through text-muted">${room.pricePerNight}</div>
                                    <div className="fs-4 fw-bold" style={{ color: '#C9A961' }}>${(room.pricePerNight * getDiscountMultiplier(user?.membershipTier)).toFixed(2)}</div>
                                    <small className="text-muted">/ {t('rooms.perNight') || 'night'}</small>
                                    <div className="badge bg-success mt-1">
                                        <FaTag className="me-1" />
                                        {user.membershipTier} Member
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="fs-4 fw-bold" style={{ color: '#8B6F47' }}>${room.pricePerNight}</div>
                                    <small className="text-muted">/ {t('rooms.perNight') || 'night'}</small>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">{t('booking.duration') || 'Duration'}</span>
                      <span className="fw-bold">{calculateNights()} {t('booking.nights') || 'nights'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">{t('booking.checkIn') || 'Check-in'}</span>
                      <span className="fw-bold">{checkInDate ? format(checkInDate, 'MMM d, yyyy') : '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3 pb-3 border-bottom" style={{ borderColor: 'rgba(201, 169, 97, 0.2)' }}>
                      <span className="text-muted">{t('booking.checkOut') || 'Check-out'}</span>
                      <span className="fw-bold">{checkOutDate ? format(checkOutDate, 'MMM d, yyyy') : '-'}</span>
                    </div>
                    
                    {isMember && discountAmount > 0 && (
                      <div className="mb-2 p-2 bg-light rounded" style={{ background: 'rgba(201, 169, 97, 0.1)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-muted small">Standard Price:</span>
                          <span className="text-decoration-line-through text-muted">${standardTotal.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-success small fw-bold">
                            <FaTag className="me-1" />
                            {user.membershipTier} Discount:
                          </span>
                          <span className="text-success fw-bold">-${discountAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <span className="h5 mb-0">{t('booking.totalAmount') || 'Total Amount'}</span>
                      <span className="h3 mb-0 fw-bold" style={{ color: '#C9A961' }}>${calculateTotal().toFixed(2)}</span>
                    </div>
                    
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mt-4 p-3 bg-light rounded-3">
                        <small className="text-muted text-uppercase fw-bold d-block mb-2">{t('booking.includedAmenities') || 'Included Amenities'}</small>
                        <div className="d-flex flex-wrap gap-2">
                          {room.amenities.slice(0, 5).map(a => (
                            <span key={a} className="badge bg-white text-dark border" style={{ fontWeight: 500 }}>{a}</span>
                          ))}
                          {room.amenities.length > 5 && (
                              <span className="badge bg-white text-dark border">+{room.amenities.length - 5} {t('common.more') || 'more'}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <FaInfoCircle size={32} className="mb-3 opacity-50" />
                    <p>{t('booking.selectRoomSummary') || 'Select a room to see booking summary'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;
