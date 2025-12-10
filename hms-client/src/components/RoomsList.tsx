import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSettings } from '../contexts/SettingsContext';
import { roomsApi, Room } from '../services/api';
import { motion } from 'framer-motion';
import LoadingSpinner from './common/LoadingSpinner';
import ImageGallery from './common/ImageGallery';
import FeedbackModal from './common/FeedbackModal';
import DatePicker from 'react-datepicker';
import { format, differenceInDays, parseISO } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import './RoomsList.css';

interface RatePlan {
  id: string;
  name: string;
  tags: string[];
  paymentType: 'online' | 'property';
  cancellation: string;
  originalPrice: number;
  discountedPrice?: number;
  points?: number;
  availability: number;
}

const RoomsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isAuthenticated, user } = useAuth();
  
  // Get params from URL or use defaults
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const roomsParam = searchParams.get('rooms') || '1';
  const adultsParam = searchParams.get('adults') || '2';
  const childrenParam = searchParams.get('children') || '0';
  const roomIdParam = searchParams.get('roomId');
  
  const [checkInDate, setCheckInDate] = useState<Date>(() => {
    if (checkInParam) {
      return parseISO(checkInParam);
    }
    return new Date();
  });
  const [checkOutDate, setCheckOutDate] = useState<Date>(() => {
    if (checkOutParam) {
      return parseISO(checkOutParam);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [numberOfRooms, setNumberOfRooms] = useState(parseInt(roomsParam));
  const [adults, setAdults] = useState(parseInt(adultsParam));
  const [children, setChildren] = useState(parseInt(childrenParam));
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const { settings } = useSettings();

  const datePickerRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  // Auto-search when component mounts
  useEffect(() => {
    handleSearch();
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

  const handleSearch = async () => {
    if (!checkInDate || !checkOutDate) {
      setError(t('availability.selectDates') || 'Please select both check-in and check-out dates');
      return;
    }

    if (checkOutDate <= checkInDate) {
      setError(t('availability.invalidDates') || 'Check-out date must be after check-in date');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    // Update URL params
    const params = new URLSearchParams({
      checkIn: format(checkInDate, 'yyyy-MM-dd'),
      checkOut: format(checkOutDate, 'yyyy-MM-dd'),
      rooms: numberOfRooms.toString(),
      adults: adults.toString(),
      children: children.toString(),
    });
    if (roomIdParam) params.set('roomId', roomIdParam);
    setSearchParams(params);

    try {
      const availableRooms = await roomsApi.getAvailable(
        format(checkInDate, 'yyyy-MM-dd'),
        format(checkOutDate, 'yyyy-MM-dd')
      );
      
      // Filter by roomId if specified
      let filteredRooms = availableRooms;
      if (roomIdParam) {
        filteredRooms = availableRooms.filter(r => r.id.toString() === roomIdParam);
      }
      
      setRooms(filteredRooms);
      
      // If no rooms found and we searched, specific error is handled in render
    } catch (err) {
      setError(t('availability.searchFailed') || 'Failed to check availability. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    return differenceInDays(checkOutDate, checkInDate);
  };

  const nights = calculateNights();

  // Generate rate plans for each room
  const generateRatePlans = (room: Room): RatePlan[] => {
    // Use pricePerNight directly from database (room.pricePerNight)
    const basePrice = room.pricePerNight;
    
    // Get discount from hotel settings (stored as percentages: 10 = 10% off)
    const memberDiscount = settings?.memberDiscount ?? 10;
    const silverDiscount = settings?.silverDiscount ?? 15;
    const goldDiscount = settings?.goldDiscount ?? 20;
    const platinumDiscount = settings?.platinumDiscount ?? 25;
    
    // Calculate discount multiplier based on tier (convert percentage to multiplier)
    let discountPercent = memberDiscount; // Default member discount
    if (user?.membershipTier === 'Silver') discountPercent = silverDiscount;
    if (user?.membershipTier === 'Gold') discountPercent = goldDiscount;
    if (user?.membershipTier === 'Platinum') discountPercent = platinumDiscount;
    
    // Convert percentage to multiplier (e.g., 10% off = 0.9 multiplier)
    let discountMultiplier = 1 - (discountPercent / 100);
    
    // Only apply discount if user is verified (email confirmed)
    // If user is not logged in, show potential member price
    if (user && !user.emailConfirmed) {
      discountMultiplier = 1; // No discount for unverified users
    }

    return [
      {
        id: 'standard',
        name: t('availability.rateStandard'),
        tags: [t('availability.freeCancellation'), t('availability.breakfastIncluded')],
        paymentType: 'property',
        cancellation: t('availability.freeCancellation'),
        originalPrice: basePrice,
        points: Math.round(basePrice),
        availability: Math.floor(Math.random() * 3) + 1,
      },
      {
        id: 'member',
        name: t('availability.rateMember'),
        tags: [t('availability.membersExclusive'), t('availability.breakfastIncluded')],
        paymentType: 'online',
        cancellation: t('availability.nonRefundable'),
        originalPrice: basePrice,
        discountedPrice: basePrice * discountMultiplier,
        points: Math.round(basePrice * discountMultiplier),
        availability: Math.floor(Math.random() * 3) + 1,
      }
    ];
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    if (start) setCheckInDate(start);
    if (end) {
      setCheckOutDate(end);
      setShowDatePicker(false);
    }
  };

  return (
    <div className="availability-container-luxury">
      <div className="availability-content-luxury">
        {/* Search Bar */}
        <motion.div
          className="availability-search-bar-luxury"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="search-bar-content-luxury">
            <div className="search-field-luxury" ref={datePickerRef}>
              <label className="search-label-luxury">{t('availability.dates') || 'Dates'}</label>
              <div
                className="search-input-luxury date-input-luxury"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                {format(checkInDate, 'MMM dd, yyyy')} - {format(checkOutDate, 'MMM dd, yyyy')} ({nights} {nights === 1 ? t('availability.night') || 'night' : t('availability.nights') || 'nights'})
              </div>
              {showDatePicker && (
                <div className="date-picker-popup-availability">
                  <DatePicker
                    selected={checkInDate}
                    onChange={handleDateChange}
                    startDate={checkInDate}
                    endDate={checkOutDate}
                    selectsRange
                    inline
                    minDate={new Date()}
                    calendarClassName="availability-date-picker-calendar"
                  />
                </div>
              )}
            </div>
            <div className="search-field-luxury" ref={guestRef}>
              <label className="search-label-luxury">{t('availability.guests') || 'Guests'}</label>
              <div
                className="search-input-luxury guest-input-luxury"
                onClick={() => setShowGuestPicker(!showGuestPicker)}
              >
                {numberOfRooms} {numberOfRooms === 1 ? t('availability.room') : t('availability.rooms')}, {adults} {adults === 1 ? t('availability.adult') : t('availability.adults')}, {children} {children === 0 ? '' : children === 1 ? t('availability.child') : t('availability.children')}
              </div>
              {showGuestPicker && (
                <div className="guest-picker-popup-luxury">
                  <div className="guest-picker-row-luxury">
                    <label>{t('availability.rooms')}</label>
                    <div className="guest-picker-controls-luxury">
                      <button
                        type="button"
                        onClick={() => numberOfRooms > 1 && setNumberOfRooms(numberOfRooms - 1)}
                        className="guest-control-btn-luxury"
                      >
                        -
                      </button>
                      <span>{numberOfRooms}</span>
                      <button
                        type="button"
                        onClick={() => numberOfRooms < 3 && setNumberOfRooms(numberOfRooms + 1)}
                        className="guest-control-btn-luxury"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="guest-picker-row-luxury">
                    <label>{t('availability.adults')}</label>
                    <div className="guest-picker-controls-luxury">
                      <button
                        type="button"
                        onClick={() => adults > 1 && setAdults(adults - 1)}
                        className="guest-control-btn-luxury"
                      >
                        -
                      </button>
                      <span>{adults}</span>
                      <button
                        type="button"
                        onClick={() => adults < 6 && setAdults(adults + 1)}
                        className="guest-control-btn-luxury"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="guest-picker-row-luxury">
                    <label>{t('availability.children')} ({t('availability.under12')})</label>
                    <div className="guest-picker-controls-luxury">
                      <button
                        type="button"
                        onClick={() => children > 0 && setChildren(children - 1)}
                        className="guest-control-btn-luxury"
                      >
                        -
                      </button>
                      <span>{children}</span>
                      <button
                        type="button"
                        onClick={() => children < 4 && setChildren(children + 1)}
                        className="guest-control-btn-luxury"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="search-btn-luxury"
                    onClick={() => {
                      setShowGuestPicker(false);
                      handleSearch();
                    }}
                  >
                    {t('availability.search') || 'Search'}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className="search-btn-luxury"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? t('availability.searching') || 'Searching...' : t('availability.search') || 'Search'}
            </button>
          </div>
        </motion.div>

        {/* Average per night header */}
        {searched && !loading && rooms.length > 0 && (
          <motion.div
            className="average-header-luxury"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3>{t('availability.averagePerNight') || 'Average per night'}</h3>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            className="availability-error-luxury"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <LoadingSpinner text={t('availability.searching') || 'Searching for available rooms...'} />
        )}

        {/* Results */}
        {searched && !loading && rooms.length > 0 && (
          <motion.div
            className="availability-results-luxury"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {Object.values(rooms.reduce((acc: any, room: Room) => {
              if (!acc[room.roomType]) {
                acc[room.roomType] = {
                  roomType: room.roomType,
                  rooms: [],
                  count: 0,
                  representative: room
                };
              }
              acc[room.roomType].rooms.push(room);
              acc[room.roomType].count++;
              return acc;
            }, {})).map((group: any) => {
              const room = group.representative;
              const availableCount = group.count;
              // Use the first available room ID for booking
              const bookingRoomId = group.rooms[0].id;
              
              const ratePlans = generateRatePlans(room);
              const imageUrl = room.imageUrls && room.imageUrls.length > 0 ? room.imageUrls[0] : null;
              
              return (
                <motion.div
                  key={room.roomType}
                  className="room-availability-card-luxury"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="room-availability-layout-luxury">
                    {/* Left: Room Image & Info */}
                    <div className="room-info-section-luxury">
                      <div style={{ height: '220px', marginBottom: '1rem', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                         <ImageGallery 
                           images={room.imageUrls || []} 
                           height="100%" 
                           showThumbnails={false} // Simple view for list
                           allowFullscreen={false}
                         />
                         {!imageUrl && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#f5f5f5', color: '#999' }}>
                              <span style={{ fontSize: '2rem' }}>🏨</span>
                              <span>No image</span>
                            </div>
                         )}
                         {/* Status Badge Overlay */}
                         <div className={`room-status-badge-luxury status-${room.status.toLowerCase()}`} style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
                           {room.status}
                         </div>
                      </div>
                      
                      <div className="room-info-content-luxury">
                        <h3 className="room-name-luxury">{t(`roomType.${room.roomType}`) || room.roomType}</h3>
                        <p className="room-size-luxury">{room.size || '45 sqm / 484 sqf'}</p>
                        
                        {room.amenities && room.amenities.length > 0 && (
                          <div className="room-amenities-tags mb-2">
                            {room.amenities.slice(0, 3).map((amenity: string, i: number) => (
                              <span key={i} className="badge bg-light text-dark border me-1" style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>
                                {amenity}
                              </span>
                            ))}
                            {room.amenities.length > 3 && (
                              <span className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                                +{room.amenities.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <Link to={`/rooms/${room.id}`} className="room-details-btn-luxury">
                          {t('availability.roomDetails') || 'Room Details'}
                        </Link>
                      </div>
                    </div>

                    {/* Right: Rate Plans & Pricing Combined */}
                    <div className="rate-plans-section-luxury">
                      {ratePlans.map((plan: RatePlan) => {
                        const totalPrice = (plan.discountedPrice || plan.originalPrice) * nights;
                        const originalTotal = plan.originalPrice * nights;
                        
                        return (
                          <div key={plan.id} className="rate-plan-card-luxury">
                            <div className="rate-plan-content-wrapper">
                              {/* Plan Details */}
                              <div className="rate-plan-details-luxury">
                                <div className="rate-plan-header-luxury">
                                  <h4 className="rate-plan-name-luxury">
                                    {plan.id === 'standard' ? t('availability.rateStandard') : 
                                     plan.id === 'member' ? t('availability.rateMember') : plan.name}
                                  </h4>
                                  <div className="rate-plan-tags-luxury">
                                    {plan.tags.map((tag, tagIndex) => (
                                      <span key={tagIndex} className="rate-plan-tag-luxury">{tag}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="rate-plan-info-grid">
                                  <div className="rate-plan-detail-item-luxury">
                                    <span className="detail-label-luxury">{t('availability.payment')}:</span>
                                    <span className="detail-value-luxury">{plan.paymentType === 'online' ? t('availability.payOnline') : t('availability.payAtProperty')}</span>
                                  </div>
                                  <div className="rate-plan-detail-item-luxury">
                                    <span className="detail-label-luxury">{t('availability.cancellation')}:</span>
                                    <span className="detail-value-luxury">{plan.cancellation}</span>
                                  </div>
                                  <div className="rate-plan-detail-item-luxury">
                                    <span className="detail-label-luxury">{t('availability.earn')}:</span>
                                    <span className="detail-value-luxury">≈ {plan.points} / {t('availability.night')}</span>
                                  </div>
                                </div>
                                <Link to="#" className="rate-details-link-luxury">{t('availability.rateDetails')}</Link>
                              </div>

                              {/* Pricing & Action */}
                              <div className="rate-plan-pricing-luxury">
                                <div className="price-display-container">
                                  {plan.discountedPrice ? (
                                    <>
                                      <div className="original-price-luxury">
                                        {formatPrice(originalTotal)}
                                      </div>
                                      <div className="current-price-luxury">
                                        {formatPrice(totalPrice)}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="current-price-luxury">
                                      {formatPrice(totalPrice)}
                                    </div>
                                  )}
                                </div>
                                
                                {isAuthenticated ? (
                                  plan.id === 'member' && !user?.emailConfirmed ? (
                                    <button
                                      type="button"
                                      className="book-now-btn-luxury"
                                      onClick={() => setShowVerifyModal(true)}
                                    >
                                      {t('availability.bookNow') || 'Book Now'}
                                    </button>
                                  ) : (
                                    <Link
                                      to={`/bookings/create?roomId=${bookingRoomId}&checkIn=${format(checkInDate, 'yyyy-MM-dd')}&checkOut=${format(checkOutDate, 'yyyy-MM-dd')}&ratePlan=${plan.id}`}
                                      className="book-now-btn-luxury"
                                    >
                                      {t('availability.bookNow') || 'Book Now'}
                                    </Link>
                                  )
                                ) : (
                                  <Link
                                    to={`/login?redirect=/rooms?checkIn=${format(checkInDate, 'yyyy-MM-dd')}&checkOut=${format(checkOutDate, 'yyyy-MM-dd')}&roomId=${bookingRoomId}`}
                                    className="book-now-btn-luxury"
                                  >
                                    {t('availability.bookNow') || 'Book Now'}
                                  </Link>
                                )}
                                <div className="availability-warning-luxury" style={{ color: availableCount <= 3 ? '#dc3545' : '#28a745', textAlign: 'right' }}>
                                  {availableCount === 1 
                                    ? (t('availability.onlyOneRoomLeft') || 'Only 1 room left')
                                    : (t('availability.onlyRoomsLeft')?.replace('{count}', availableCount.toString()) || `Only ${availableCount} rooms left`)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* No Results */}
        {searched && !loading && rooms.length === 0 && !error && (
          <motion.div
            className="empty-state-luxury"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="empty-icon-luxury">🔍</div>
            <h3>{t('availability.noRoomsFound') || 'No rooms available'}</h3>
            <p>{t('availability.tryDifferentDates') || 'Please try different dates or check back later.'}</p>
          </motion.div>
        )}

        {/* Email Verification Modal */}
        <FeedbackModal
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          type="confirm"
          title={t('common.verificationRequired') || "Verification Required"}
          message={t('common.verifyEmailMessage') || "Please verify your email address to unlock Member Exclusive Rates."}
          confirmText={t('common.goToProfile') || "Go to Profile"}
          onConfirm={() => navigate('/profile')}
        />
      </div>
    </div>
  );
};

export default RoomsList;