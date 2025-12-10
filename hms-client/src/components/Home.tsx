import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { reviewsApi, ReviewStats, Review } from '../services/api';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ImageGallery from './common/ImageGallery';
import FeedbackModal from './common/FeedbackModal'; // Import FeedbackModal
import 'react-datepicker/dist/react-datepicker.css';
import './Home.css';
import { FaCheck, FaTimes, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTwitter, FaClock } from 'react-icons/fa';

const Home: React.FC = () => {
  const { isAuthenticated, isAdmin, isManager, isReceptionist, isRoomAttendant } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [rooms, setRooms] = useState([{ adults: 2, children: 0 }]);
  const [selectedOffer, setSelectedOffer] = useState<any>(null); // State for selected offer
  
  // Review stats & list
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false, title: '', message: '', type: 'success'
  });
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  // Redirect staff roles to dashboard (only if not already on root path)
  useEffect(() => {
    if (isAuthenticated && (isAdmin || isManager || isReceptionist || isRoomAttendant)) {
      const currentPath = window.location.pathname;
      if (currentPath === '/') {
        if (isAdmin) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [isAuthenticated, isAdmin, isManager, isReceptionist, isRoomAttendant, navigate]);

  // Load review stats and recent reviews
  const loadReviewsData = async () => {
    try {
      const stats = await reviewsApi.getStats();
      setReviewStats(stats);
      
      // Fetch recent approved reviews
      const reviews = await reviewsApi.getAll(true);
      // Sort by date desc and take top 3
      const sortedReviews = reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
      setRecentReviews(sortedReviews);
    } catch (error) {
      console.error('Failed to load reviews data:', error);
      setReviewStats({
        averageRating: 4.7,
        totalReviews: 2859,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, []);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    if (reviewRating === 0) {
      setFeedbackModal({ isOpen: true, title: 'Rating Required', message: 'Please select a star rating.', type: 'error' });
      return;
    }

    try {
      await reviewsApi.create({
        rating: reviewRating,
        comment: reviewComment
      });
      setFeedbackModal({ isOpen: true, title: 'Thank You!', message: 'Your review has been submitted successfully.', type: 'success' });
      setReviewRating(0);
      setReviewComment('');
      // Refresh reviews list to show the new review immediately
      loadReviewsData();
    } catch (error) {
      console.error('Failed to submit review:', error);
      setFeedbackModal({ isOpen: true, title: 'Error', message: 'Failed to submit review. Please try again later.', type: 'error' });
    }
  };

  const handleInteraction = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    }
  };

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setShowGuestPicker(false);
      }
    };

    if (showDatePicker || showGuestPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker, showGuestPicker]);

  const handleSearch = () => {
    const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
    const totalChildren = rooms.reduce((sum, room) => sum + room.children, 0);
    const params = new URLSearchParams({
      checkIn: format(checkInDate, 'yyyy-MM-dd'),
      checkOut: format(checkOutDate, 'yyyy-MM-dd'),
      rooms: rooms.length.toString(),
      adults: totalAdults.toString(),
      children: totalChildren.toString(),
    });
    navigate(`/rooms?${params.toString()}`);
  };

  const addRoom = () => {
    if (rooms.length < 3) {
      setRooms([...rooms, { adults: 2, children: 0 }]);
    }
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, i) => i !== index));
    }
  };

  const updateRoom = (index: number, field: 'adults' | 'children', value: number) => {
    const updatedRooms = [...rooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    setRooms(updatedRooms);
  };

  const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
  const totalChildren = rooms.reduce((sum, room) => sum + room.children, 0);

  if (isAuthenticated && (isAdmin || isManager || isReceptionist || isRoomAttendant)) {
    return null;
  }

  // Use images from settings or fallback to default gradient/placeholder
  const bannerImages = settings?.homeBannerImages && settings.homeBannerImages.length > 0 
    ? settings.homeBannerImages 
    : [];

  return (
    <div className="home-container">
      {/* Hero Section with Image Gallery */}
      <motion.section
        className="hero-image-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{ height: '80vh', position: 'relative', padding: 0 }}
      >
        {bannerImages.length > 0 ? (
          <ImageGallery 
            images={bannerImages} 
            height="100%" 
            showThumbnails={false}
            allowFullscreen={false}
            className="home-hero-gallery"
            autoPlay={true}
            interval={3000}
          />
        ) : (
          <div className="hero-image-placeholder">
            <div className="hotel-image-gradient"></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', textAlign: 'center' }}>
              <h1>{settings?.hotelName || 'Welcome to Luxury'}</h1>
              <p>{settings?.welcomeDescription}</p>
            </div>
          </div>
        )}
      </motion.section>

      {/* Booking Widget */}
      <motion.div
        className="booking-widget"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="booking-widget-content">
          {/* Combined Date Range Picker */}
          <div className="booking-field booking-date-range-field" ref={datePickerRef}>
            <span className="booking-icon">📅</span>
            <div 
              className="booking-date-info"
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                setShowGuestPicker(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              <span className="booking-label">{t('booking.checkIn')} / {t('booking.checkOut')}</span>
              <span className="booking-value">
                {format(checkInDate, 'MMM dd, yyyy')} - {format(checkOutDate, 'MMM dd, yyyy')} ({Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))} {Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) === 1 ? 'night' : 'nights'})
              </span>
            </div>
            {showDatePicker && (
              <div className="date-picker-popup date-range-picker-popup">
                <div className="date-range-calendar-container">
                  <div className="date-range-calendar-section">
                    <DatePicker
                      selected={checkInDate}
                      onChange={(date: Date) => {
                        setCheckInDate(date);
                        if (date >= checkOutDate) {
                          const nextDay = new Date(date);
                          nextDay.setDate(nextDay.getDate() + 1);
                          setCheckOutDate(nextDay);
                        }
                      }}
                      minDate={new Date()}
                      inline
                      calendarClassName="luxury-calendar luxury-calendar-left"
                      selectsStart
                      startDate={checkInDate}
                      endDate={checkOutDate}
                    />
                  </div>
                  <div className="date-range-calendar-section">
                    <DatePicker
                      selected={checkOutDate}
                      onChange={(date: Date) => {
                        setCheckOutDate(date);
                        if (date && checkInDate) {
                          setTimeout(() => {
                            setShowDatePicker(false);
                          }, 100);
                        }
                      }}
                      minDate={checkInDate}
                      inline
                      calendarClassName="luxury-calendar luxury-calendar-right"
                      selectsEnd
                      startDate={checkInDate}
                      endDate={checkOutDate}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guests */}
          <div className="booking-field" ref={guestRef}>
            <span className="booking-icon">👥</span>
            <div 
              className="booking-date-info"
              onClick={() => {
                setShowGuestPicker(!showGuestPicker);
                setShowDatePicker(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              <span className="booking-label">{t('booking.guests')}</span>
              <span className="booking-value">
                {rooms.length} {rooms.length === 1 ? t('booking.room') : t('booking.rooms')}, {totalAdults} {totalAdults === 1 ? t('booking.adult') : t('booking.adults')}, {totalChildren} {totalChildren === 1 ? t('booking.child') : t('booking.children')}
              </span>
            </div>
            {showGuestPicker && (
              <div className="guest-picker-popup">
                <div className="guest-picker-header">{t('booking.maxGuests')}</div>
                <div className="guest-picker-content">
                  {rooms.map((room, index) => (
                    <div key={index} className="guest-picker-row">
                      <div className="guest-picker-row-header">
                        <div className="guest-picker-label">{t('booking.room')} {index + 1}</div>
                        {rooms.length > 1 && (
                          <button
                            type="button"
                            className="remove-room-btn"
                            onClick={() => removeRoom(index)}
                            title={t('booking.removeRoom')}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="guest-picker-controls">
                        <div className="guest-control-group">
                          <span className="guest-control-label">{t('booking.adults')}</span>
                          <div className="guest-control-buttons">
                            <button
                              type="button"
                              className="guest-control-btn"
                              onClick={() => updateRoom(index, 'adults', Math.max(1, room.adults - 1))}
                              disabled={room.adults <= 1}
                            >
                              -
                            </button>
                            <span className="guest-control-value">{room.adults}</span>
                            <button
                              type="button"
                              className="guest-control-btn"
                              onClick={() => updateRoom(index, 'adults', Math.min(6, room.adults + 1))}
                              disabled={room.adults >= 6 || (room.adults + room.children) >= 6}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="guest-control-group">
                          <span className="guest-control-label">{t('booking.children')} ({t('booking.under12')})</span>
                          <div className="guest-control-buttons">
                            <button
                              type="button"
                              className="guest-control-btn"
                              onClick={() => updateRoom(index, 'children', Math.max(0, room.children - 1))}
                              disabled={room.children <= 0}
                            >
                              -
                            </button>
                            <span className="guest-control-value">{room.children}</span>
                            <button
                              type="button"
                              className="guest-control-btn"
                              onClick={() => updateRoom(index, 'children', Math.min(6, room.children + 1))}
                              disabled={(room.adults + room.children) >= 6}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {rooms.length < 3 && (
                    <button
                      type="button"
                      className="add-room-btn"
                      onClick={addRoom}
                    >
                      + {t('booking.addRoom')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            className="booking-search-button"
            onClick={handleSearch}
          >
            {t('booking.search')}
          </button>
        </div>
      </motion.div>

      {/* Special Promotion Section (Dynamic) - REMOVED as per request */}
      {/* 
      {(settings?.promotionTitle || settings?.promotionImageUrl) && (
        <motion.section
          className="offers-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          style={{ background: '#fff', padding: '4rem 0' }}
        >
          ...
        </motion.section>
      )}
      */}

      {/* Offers Section (Dynamic) */}
      <motion.section
        className="offers-section"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <div className="section-container">
          <motion.h2
            className="section-title offers-title-centered"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
          >
            {t('offers.title')}
          </motion.h2>
          <div className="offers-grid">
            {(settings?.featuredOffers && settings.featuredOffers.length > 0 ? settings.featuredOffers : [
              {
                title: t('offers.bedBreakfast'),
                description: t('offers.bedBreakfastDesc'),
                price: '1778',
                priceLabel: t('offers.averagePerNight'),
                tags: [t('offers.stay'), t('offers.breakfastIncluded')],
                imageClass: 'offer-image-1'
              },
              {
                title: t('offers.memberSaver'),
                description: t('offers.memberSaverDesc'),
                price: '1650',
                priceLabel: t('offers.averagePerNight'),
                tags: [t('offers.stay'), t('offers.earlyBirdTag')],
                badge: t('offers.memberExclusive'),
                imageClass: 'offer-image-2'
              },
              {
                title: t('offers.earlyBird'),
                description: t('offers.earlyBirdDesc'),
                price: '1529',
                priceLabel: t('offers.averagePerNight'),
                tags: [t('offers.stay'), t('offers.freeParking')],
                imageClass: 'offer-image-3'
              }
            ]).map((offer: any, index: number) => (
              <motion.div key={index} className="offer-card" whileHover={{ scale: 1.03, y: -5 }}>
                <div 
                  className={`offer-image ${offer.imageClass || ''}`}
                  style={offer.imageUrl ? { backgroundImage: `url(${offer.imageUrl})` } : {}}
                >
                  {offer.badge && <span className="offer-badge">{offer.badge}</span>}
                </div>
                <div className="offer-content">
                  <div className="offer-tags">
                    {offer.tags.map((tag: string, i: number) => (
                      <span key={i} className="offer-tag">{tag}</span>
                    ))}
                  </div>
                  <h3 className="offer-title">{offer.title}</h3>
                  <p className="offer-description">{offer.description}</p>
                  <div className="offer-price">
                    {/* Try to parse price as number for formatting, otherwise show as string */}
                    {!isNaN(parseFloat(offer.price)) ? formatPrice(parseFloat(offer.price)) : offer.price} 
                    {' '}
                    {offer.priceLabel}
                  </div>
                  <button className="offer-button" onClick={() => setSelectedOffer(offer)}>{t('offers.viewDetails')}</button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="view-all-link">
            <Link to="/offers">{t('offers.viewAll')}</Link>
          </div>
        </div>
      </motion.section>

      {/* Offer Details Modal */}
      <AnimatePresence>
        {selectedOffer && (
          <motion.div 
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOffer(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(5px)'
            }}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '20px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '0',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => setSelectedOffer(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <FaTimes />
              </button>

              <div className="row g-0">
                <div className="col-md-6">
                  <div style={{ height: '100%', minHeight: '300px', background: '#f8f9fa' }}>
                     {selectedOffer.imageUrl ? (
                       <img 
                         src={selectedOffer.imageUrl} 
                         alt={selectedOffer.title} 
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                       />
                     ) : (
                       <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0e6d2 0%, #d4c5a9 100%)' }}>
                         <span style={{ fontSize: '3rem', opacity: 0.3 }}>🏨</span>
                       </div>
                     )}
                  </div>
                </div>
                <div className="col-md-6 p-4 d-flex flex-column">
                  <div className="mb-auto">
                    {selectedOffer.badge && (
                      <span className="badge mb-3" style={{ background: '#C9A961', color: 'white', fontWeight: 500, letterSpacing: '1px', padding: '0.5em 1em' }}>
                        {selectedOffer.badge}
                      </span>
                    )}
                    <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C', marginBottom: '1rem' }}>
                      {selectedOffer.title}
                    </h2>
                    
                    <div className="d-flex flex-wrap gap-2 mb-4">
                      {selectedOffer.tags && selectedOffer.tags.map((tag: string, i: number) => (
                        <span key={i} style={{ fontSize: '0.85rem', color: '#666', background: '#f0f0f0', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <p style={{ color: '#555', lineHeight: '1.7', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
                      {selectedOffer.description}
                    </p>

                    <div className="d-flex align-items-baseline gap-2 mb-4 p-3 bg-light rounded-3">
                      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C9A961' }}>
                        {!isNaN(parseFloat(selectedOffer.price)) ? formatPrice(parseFloat(selectedOffer.price)) : selectedOffer.price}
                      </span>
                      <span className="text-muted">{selectedOffer.priceLabel}</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                      <li className="d-flex align-items-center gap-2 mb-2 text-muted">
                         <FaCheck style={{ color: '#28a745', fontSize: '0.8rem' }} /> Best Rate Guarantee
                      </li>
                      <li className="d-flex align-items-center gap-2 mb-2 text-muted">
                         <FaCheck style={{ color: '#28a745', fontSize: '0.8rem' }} /> No Booking Fees
                      </li>
                      <li className="d-flex align-items-center gap-2 text-muted">
                         <FaCheck style={{ color: '#28a745', fontSize: '0.8rem' }} /> Instant Confirmation
                      </li>
                    </ul>
                  </div>

                  <button 
                    className="offer-button w-100" 
                    style={{ marginTop: 'auto' }}
                    onClick={() => {
                        navigate('/rooms');
                        setSelectedOffer(null);
                    }}
                  >
                    {t('booking.bookNow') || 'Book Now'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Section */}
      <motion.section
        className="about-section"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.1, duration: 0.6 }}
      >
        <div className="section-container">
          <div className="about-layout">
            <div className="about-content">
              <motion.h2 className="section-title" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                {settings?.aboutTitle || t('about.title')}
              </motion.h2>
              <motion.p className="about-description" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                {settings?.aboutDescription || t('about.description')}
              </motion.p>
              <motion.ul className="about-features" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <li>{t('about.rooms')}</li>
                <li>{t('about.restaurants')}</li>
                <li>{t('about.pool')}</li>
              </motion.ul>
              <motion.button className="about-button" whileHover={{ scale: 1.05 }}>{t('about.learnMore')}</motion.button>
            </div>
            <motion.div className="about-image" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              {settings?.aboutImageUrl ? (
                <img src={settings.aboutImageUrl} alt={settings.aboutTitle || "About Hotel"} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
              ) : (
                <div className="hotel-lobby-image"></div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Room Types Section */}
      <motion.section
        className="room-types-section"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4, duration: 0.6 }}
      >
        <div className="section-container">
          <motion.h2 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>{t('roomTypes.title')}</motion.h2>
          <motion.p className="room-types-description" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>{t('roomTypes.description')}</motion.p>
          <div className="room-types-grid">
            {[
              { type: 'Single', icon: '🛏️', desc: t('roomTypes.single') },
              { type: 'Double', icon: '👫', desc: t('roomTypes.double') },
              { type: 'Suite', icon: '🏰', desc: t('roomTypes.suite') },
              { type: 'Deluxe', icon: '✨', desc: t('roomTypes.deluxe') },
            ].map((roomType, index) => (
              <motion.div
                key={roomType.type}
                className="room-type-card"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="room-type-icon">{roomType.icon}</div>
                <h3 className="room-type-name">{roomType.type}</h3>
                <p className="room-type-desc">{roomType.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Reviews Section */}
      <motion.section
        className="reviews-section"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3, duration: 0.6 }}
      >
        <div className="section-container">
          <div className="reviews-layout">
            <motion.div className="reviews-rating-box" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="rating-score">{reviewStats ? `${reviewStats.averageRating}/5` : '4.7/5'}</div>
              <div className="rating-label">{t('reviews.rating')}</div>
              <div className="rating-count">{reviewStats ? reviewStats.totalReviews : 2859} {t('reviews.reviews')}</div>
            </motion.div>
            <div className="reviews-content">
              <motion.h2 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>{t('reviews.title')}</motion.h2>
              
              {/* Recent Reviews List */}
              {recentReviews.length > 0 && (
                <div className="recent-reviews mb-5">
                  <div className="row g-4">
                    {recentReviews.map((review) => (
                      <div className="col-md-4" key={review.id}>
                        <div className="review-card p-4 h-100 bg-white rounded-3 shadow-sm border border-light">
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <div className="review-avatar rounded-circle bg-light d-flex align-items-center justify-content-center text-muted fw-bold" style={{ width: '40px', height: '40px' }}>
                              {review.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h6 className="mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>{review.userName}</h6>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(review.createdAt).toLocaleDateString()}</small>
                            </div>
                          </div>
                          <div className="mb-3 text-warning" style={{ fontSize: '0.9rem' }}>
                            {[...Array(5)].map((_, i) => (
                              <span key={i} style={{ opacity: i < review.rating ? 1 : 0.3 }}>⭐</span>
                            ))}
                          </div>
                          <p className="mb-0 text-secondary small" style={{ lineHeight: '1.6' }}>"{review.comment}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <motion.div className="review-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3>{t('reviews.writeReview')}</h3>
                <div className="review-rating-input">
                  <label>{t('reviews.yourRating')}</label>
                  <div className="star-rating" onClick={handleInteraction}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className="star" 
                        style={{ 
                          cursor: 'pointer', 
                          opacity: star <= reviewRating ? 1 : 0.3,
                          transform: star <= reviewRating ? 'scale(1.1)' : 'scale(1)'
                        }}
                        onClick={() => isAuthenticated && setReviewRating(star)}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
                <div className="review-comment-input">
                  <label>{t('reviews.yourComment')}</label>
                  <textarea 
                    className="review-textarea" 
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    onClick={handleInteraction}
                    readOnly={!isAuthenticated}
                    placeholder={!isAuthenticated ? "Please login to write a review..." : "Share your experience..."}
                  ></textarea>
                </div>
                <button 
                  className="review-submit-button"
                  onClick={handleSubmitReview}
                >
                  {isAuthenticated ? t('reviews.submit') : "Login to Submit"}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />

      {/* Login Prompt Modal */}
      <FeedbackModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Login Required"
        message="You need to be logged in to write a review. Would you like to login or register now?"
        type="info"
        confirmText="Login / Register"
        cancelText="Cancel"
        onConfirm={() => navigate('/login')}
      />

      {/* Contact & Policies Section */}
      <motion.section
        className="contact-section"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.3, duration: 0.6 }}
        style={{ background: '#f8f9fa', padding: '5rem 0', borderTop: '1px solid #eee' }}
      >
        <div className="container">
          <div className="row g-5">
            {/* Contact Details */}
            <div className="col-md-4">
              <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '1.5rem', color: '#2C2C2C' }}>Contact Us</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li className="d-flex align-items-start gap-3 mb-3">
                  <div style={{ width: '24px', height: '24px', background: '#C9A961', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <FaMapMarkerAlt size={12} />
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold" style={{ fontSize: '0.9rem' }}>Address</h6>
                    <p className="text-muted mb-0 small">{settings?.address || '123 Luxury Avenue'}</p>
                  </div>
                </li>
                <li className="d-flex align-items-start gap-3 mb-3">
                  <div style={{ width: '24px', height: '24px', background: '#C9A961', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <FaPhone size={12} />
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold" style={{ fontSize: '0.9rem' }}>Phone</h6>
                    <p className="text-muted mb-0 small">{settings?.phone || '+1 (555) 123-4567'}</p>
                  </div>
                </li>
                <li className="d-flex align-items-start gap-3 mb-3">
                  <div style={{ width: '24px', height: '24px', background: '#C9A961', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <FaEnvelope size={12} />
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold" style={{ fontSize: '0.9rem' }}>Email</h6>
                    <p className="text-muted mb-0 small">{settings?.email || 'concierge@hmshotel.com'}</p>
                  </div>
                </li>
              </ul>
              
              {/* Social Media */}
              <div className="mt-4">
                <h6 className="mb-3 fw-bold" style={{ fontSize: '0.9rem' }}>Follow Us</h6>
                <div className="d-flex gap-3">
                  {settings?.facebookUrl && (
                    <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="social-icon-link" style={{ width: '36px', height: '36px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b5998', border: '1px solid #eee', transition: 'all 0.2s' }}>
                      <FaFacebook />
                    </a>
                  )}
                  {settings?.instagramUrl && (
                    <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="social-icon-link" style={{ width: '36px', height: '36px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e1306c', border: '1px solid #eee', transition: 'all 0.2s' }}>
                      <FaInstagram />
                    </a>
                  )}
                  {settings?.twitterUrl && (
                    <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="social-icon-link" style={{ width: '36px', height: '36px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1da1f2', border: '1px solid #eee', transition: 'all 0.2s' }}>
                      <FaTwitter />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="col-md-4">
              <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '1.5rem', color: '#2C2C2C' }}>Hotel Policies</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom" style={{ borderColor: '#eee' }}>
                  <FaClock style={{ color: '#C9A961' }} />
                  <div className="flex-grow-1">
                    <span className="d-block fw-bold text-dark">Check-in Time</span>
                    <small className="text-muted">From {settings?.checkInTime || '15:00'}</small>
                  </div>
                </li>
                <li className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom" style={{ borderColor: '#eee' }}>
                  <FaClock style={{ color: '#C9A961' }} />
                  <div className="flex-grow-1">
                    <span className="d-block fw-bold text-dark">Check-out Time</span>
                    <small className="text-muted">Until {settings?.checkOutTime || '11:00'}</small>
                  </div>
                </li>
                <li className="d-flex align-items-center gap-3 mb-3">
                  <FaCheck style={{ color: '#C9A961' }} />
                  <div className="flex-grow-1">
                    <span className="d-block fw-bold text-dark">Cancellation</span>
                    <small className="text-muted">Free cancellation up to 24 hours before arrival.</small>
                  </div>
                </li>
              </ul>
            </div>

            {/* Newsletter / Brand */}
            <div className="col-md-4">
              <div className="p-4 rounded-3 text-center" style={{ background: '#fff', border: '1px solid rgba(201, 169, 97, 0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#C9A961', marginBottom: '0.5rem' }}>HMS</h2>
                <p className="text-uppercase small fw-bold text-muted mb-4">Luxury Hotel & Resort</p>
                <p className="small text-muted mb-4">
                  {settings?.welcomeDescription || 'Experience the epitome of luxury with our world-class amenities and exceptional service.'}
                </p>
                <div className="d-grid">
                  <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', border: 'none' }} onClick={() => navigate('/register')}>
                    Become a Member
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-5 pt-4 border-top" style={{ borderColor: '#eee', color: '#999', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} {settings?.hotelName || 'HMS Luxury Hotel'}. All rights reserved.
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
