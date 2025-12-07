import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { reviewsApi, ReviewStats } from '../services/api';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';
import './Home.css';

const Home: React.FC = () => {
  const { isAuthenticated, user, isAdmin, isManager, isReceptionist, isRoomAttendant, isCustomer } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { theme } = useTheme();
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
  
  // Hero image management
  const [heroImages, setHeroImages] = useState<string[]>(() => {
    const stored = localStorage.getItem('heroImages');
    return stored ? JSON.parse(stored) : [];
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageManager, setShowImageManager] = useState(false);
  
  // Review stats
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  // Redirect staff roles to dashboard
  useEffect(() => {
    if (isAuthenticated && (isAdmin || isManager || isReceptionist || isRoomAttendant)) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, isManager, isReceptionist, isRoomAttendant, navigate]);

  // Load review stats
  useEffect(() => {
    const loadReviewStats = async () => {
      try {
        const stats = await reviewsApi.getStats();
        setReviewStats(stats);
      } catch (error) {
        console.error('Failed to load review stats:', error);
        // Set default values if API fails
        setReviewStats({
          averageRating: 4.7,
          totalReviews: 2859,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }
    };
    loadReviewStats();
  }, []);

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

  // Hero image management functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...heroImages, reader.result as string];
        setHeroImages(newImages);
        localStorage.setItem('heroImages', JSON.stringify(newImages));
        setCurrentImageIndex(newImages.length - 1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = (index: number) => {
    const newImages = heroImages.filter((_, i) => i !== index);
    setHeroImages(newImages);
    localStorage.setItem('heroImages', JSON.stringify(newImages));
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(Math.max(0, newImages.length - 1));
    }
  };

  const swapImageLeft = () => {
    if (currentImageIndex > 0) {
      const newImages = [...heroImages];
      [newImages[currentImageIndex - 1], newImages[currentImageIndex]] = 
        [newImages[currentImageIndex], newImages[currentImageIndex - 1]];
      setHeroImages(newImages);
      localStorage.setItem('heroImages', JSON.stringify(newImages));
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const swapImageRight = () => {
    if (currentImageIndex < heroImages.length - 1) {
      const newImages = [...heroImages];
      [newImages[currentImageIndex], newImages[currentImageIndex + 1]] = 
        [newImages[currentImageIndex + 1], newImages[currentImageIndex]];
      setHeroImages(newImages);
      localStorage.setItem('heroImages', JSON.stringify(newImages));
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const currentHeroImage = heroImages[currentImageIndex] || null;

  // Don't render home page for staff roles
  if (isAuthenticated && (isAdmin || isManager || isReceptionist || isRoomAttendant)) {
    return null;
  }


  return (
    <div className="home-container">
      {/* Hero Section with Hotel Image */}
      <motion.section
        className="hero-image-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {currentHeroImage ? (
          <div className="hero-image-container">
            <img 
              src={currentHeroImage} 
              alt="Hotel Hero" 
              className="hero-image"
            />
            {/* Left/Right Navigation Arrows */}
            {heroImages.length > 1 && (
              <>
                <button 
                  className="hero-nav-arrow hero-nav-arrow-left"
                  onClick={() => {
                    const prevIndex = currentImageIndex === 0 ? heroImages.length - 1 : currentImageIndex - 1;
                    setCurrentImageIndex(prevIndex);
                  }}
                  title={t('home.previousImage')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button 
                  className="hero-nav-arrow hero-nav-arrow-right"
                  onClick={() => {
                    const nextIndex = currentImageIndex === heroImages.length - 1 ? 0 : currentImageIndex + 1;
                    setCurrentImageIndex(nextIndex);
                  }}
                  title={t('home.nextImage')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
            {(isAdmin || isManager) && (
              <div className="hero-image-controls">
                <button 
                  className="hero-control-btn"
                  onClick={() => setShowImageManager(true)}
                  title={t('home.manageImages')}
                >
                  🖼️
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hero-image-placeholder">
            <div className="hotel-image-gradient"></div>
            {(isAdmin || isManager) && (
              <div className="hero-image-upload-prompt">
                <button 
                  className="hero-upload-btn"
                  onClick={() => setShowImageManager(true)}
                >
                  {t('home.uploadHeroImage')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Image Manager Modal */}
        {showImageManager && (isAdmin || isManager) && (
          <div className="image-manager-modal" onClick={() => setShowImageManager(false)}>
            <div className="image-manager-content" onClick={(e) => e.stopPropagation()}>
              <div className="image-manager-header">
                <h3>{t('home.manageHeroImages')}</h3>
                <button className="close-btn" onClick={() => setShowImageManager(false)}>×</button>
              </div>
              <div className="image-manager-body">
                <div className="image-upload-section">
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <span className="upload-button">{t('home.uploadImage')}</span>
                  </label>
                </div>
                <div className="image-list">
                  {heroImages.map((img, index) => (
                    <div key={index} className={`image-item ${index === currentImageIndex ? 'active' : ''}`}>
                      <img src={img} alt={`Hero ${index + 1}`} />
                      <div className="image-actions">
                        {index > 0 && (
                          <button onClick={() => {
                            const newImages = [...heroImages];
                            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                            setHeroImages(newImages);
                            localStorage.setItem('heroImages', JSON.stringify(newImages));
                            if (currentImageIndex === index) setCurrentImageIndex(index - 1);
                            else if (currentImageIndex === index - 1) setCurrentImageIndex(index);
                          }}>←</button>
                        )}
                        <button onClick={() => setCurrentImageIndex(index)}>{t('home.setAsCurrent')}</button>
                        {index < heroImages.length - 1 && (
                          <button onClick={() => {
                            const newImages = [...heroImages];
                            [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                            setHeroImages(newImages);
                            localStorage.setItem('heroImages', JSON.stringify(newImages));
                            if (currentImageIndex === index) setCurrentImageIndex(index + 1);
                            else if (currentImageIndex === index + 1) setCurrentImageIndex(index);
                          }}>→</button>
                        )}
                        <button onClick={() => handleImageRemove(index)} className="delete-btn">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                      renderCustomHeader={({
                        date,
                        decreaseMonth,
                        increaseMonth,
                        prevMonthButtonDisabled,
                        nextMonthButtonDisabled,
                      }) => (
                        <div className="calendar-header">
                          <button
                            type="button"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="calendar-nav-btn calendar-nav-btn-prev"
                            aria-label="Previous Month"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <span className="calendar-month-label">{format(date, 'MMM yyyy')}</span>
                          <button
                            type="button"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="calendar-nav-btn calendar-nav-btn-next"
                            aria-label="Next Month"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    />
                  </div>
                  <div className="date-range-calendar-section">
                    <DatePicker
                      selected={checkOutDate}
                      onChange={(date: Date) => {
                        setCheckOutDate(date);
                        // Close the picker when end date is selected
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
                      renderCustomHeader={({
                        date,
                        decreaseMonth,
                        increaseMonth,
                        prevMonthButtonDisabled,
                        nextMonthButtonDisabled,
                      }) => (
                        <div className="calendar-header">
                          <button
                            type="button"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="calendar-nav-btn calendar-nav-btn-prev"
                            aria-label="Previous Month"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <span className="calendar-month-label">{format(date, 'MMM yyyy')}</span>
                          <button
                            type="button"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="calendar-nav-btn calendar-nav-btn-next"
                            aria-label="Next Month"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      )}
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



      {/* Offers Section */}
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
            <motion.div
              className="offer-card"
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="offer-image offer-image-1"></div>
              <div className="offer-content">
                <div className="offer-tags">
                  <span className="offer-tag">{t('offers.stay')}</span>
                  <span className="offer-tag">{t('offers.breakfastIncluded')}</span>
                  <span className="offer-tag">{t('offers.freeParking')}</span>
                </div>
                <h3 className="offer-title">{t('offers.bedBreakfast')}</h3>
                <p className="offer-description">{t('offers.bedBreakfastDesc')}</p>
                <div className="offer-price">{formatPrice(1778)} {t('offers.averagePerNight')}</div>
                <button className="offer-button">{t('offers.viewDetails')}</button>
              </div>
            </motion.div>

            <motion.div
              className="offer-card"
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="offer-image offer-image-2">
                <span className="offer-badge">{t('offers.memberExclusive')}</span>
              </div>
              <div className="offer-content">
                <div className="offer-tags">
                  <span className="offer-tag">{t('offers.stay')}</span>
                  <span className="offer-tag">{t('offers.earlyBirdTag')}</span>
                  <span className="offer-tag">{t('offers.freeParking')}</span>
                </div>
                <h3 className="offer-title">{t('offers.memberSaver')}</h3>
                <p className="offer-description">{t('offers.memberSaverDesc')}</p>
                <div className="offer-price">{formatPrice(1650)} {t('offers.averagePerNight')}</div>
                <button className="offer-button">{t('offers.viewDetails')}</button>
              </div>
            </motion.div>

            <motion.div
              className="offer-card"
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="offer-image offer-image-3"></div>
              <div className="offer-content">
                <div className="offer-tags">
                  <span className="offer-tag">{t('offers.stay')}</span>
                  <span className="offer-tag">{t('offers.earlyBirdTag')}</span>
                  <span className="offer-tag">{t('offers.freeParking')}</span>
                </div>
                <h3 className="offer-title">{t('offers.earlyBird')}</h3>
                <p className="offer-description">{t('offers.earlyBirdDesc')}</p>
                <div className="offer-price">{formatPrice(1529)} {t('offers.averagePerNight')}</div>
                <button className="offer-button">{t('offers.viewDetails')}</button>
              </div>
            </motion.div>
          </div>
          <div className="view-all-link">
            <Link to="/offers">{t('offers.viewAll')}</Link>
          </div>
        </div>
      </motion.section>

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
              <motion.h2
                className="section-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.3 }}
              >
                {t('about.title')}
              </motion.h2>
              <motion.p
                className="about-description"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.4 }}
              >
                {t('about.description')}
              </motion.p>
              <motion.ul
                className="about-features"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.5 }}
              >
                <li>{t('about.rooms')}</li>
                <li>{t('about.restaurants')}</li>
                <li>{t('about.pool')}</li>
              </motion.ul>
              <motion.button
                className="about-button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('about.learnMore')}
              </motion.button>
            </div>
            <motion.div
              className="about-image"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.3 }}
            >
              <div className="hotel-lobby-image"></div>
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
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.6 }}
          >
            {t('roomTypes.title')}
          </motion.h2>
          <motion.p
            className="room-types-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.7 }}
          >
            {t('roomTypes.description')}
          </motion.p>
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.8 + index * 0.1 }}
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
            <motion.div
              className="reviews-rating-box"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3.2 }}
            >
              <div className="rating-score">{reviewStats ? `${reviewStats.averageRating}/5` : '4.7/5'}</div>
              <div className="rating-label">{t('reviews.rating')}</div>
              <div className="rating-count">{reviewStats ? reviewStats.totalReviews : 2859} {t('reviews.reviews')}</div>
            </motion.div>
            <div className="reviews-content">
              <motion.h2
                className="section-title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.3 }}
              >
                {t('reviews.title')}
              </motion.h2>
              {isAuthenticated && (
                <motion.div
                  className="review-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.4 }}
                >
                  <h3>{t('reviews.writeReview')}</h3>
                  <div className="review-rating-input">
                    <label>{t('reviews.yourRating')}</label>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="star">⭐</span>
                      ))}
                    </div>
                  </div>
                  <div className="review-comment-input">
                    <label>{t('reviews.yourComment')}</label>
                    <textarea className="review-textarea" rows={4}></textarea>
                  </div>
                  <button className="review-submit-button">{t('reviews.submit')}</button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
