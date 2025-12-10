import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSettings } from '../contexts/SettingsContext';
import { roomsApi, Room } from '../services/api';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ImageGallery from '../components/common/ImageGallery'; // Added import
import '../components/RoomsList.css';

const RoomDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isAuthenticated, user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();

  const getDiscountMultiplier = (tier?: string) => {
    const discounts = settings || { 
        memberDiscount: 10, silverDiscount: 15, goldDiscount: 20, platinumDiscount: 25
    };
    
    let discountPercent = discounts.memberDiscount;
    if (tier === 'Silver') discountPercent = discounts.silverDiscount;
    if (tier === 'Gold') discountPercent = discounts.goldDiscount;
    if (tier === 'Platinum') discountPercent = discounts.platinumDiscount;
    
    if (user && !user.emailConfirmed) return 1;

    return 1 - (discountPercent / 100);
  };
  
  const memberPrice = room ? Math.round(room.pricePerNight * getDiscountMultiplier(user?.membershipTier)) : 0;

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        if (!id) return;
        const data = await roomsApi.getById(parseInt(id));
        setRoom(data);
      } catch (err) {
        setError(t('rooms.error') || 'Failed to load room details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id, t]);

  if (loading) {
    return <LoadingSpinner text={t('rooms.loadingDetails') || 'Loading room details...'} />;
  }

  if (error || !room) {
    return (
      <div className="rooms-container-luxury">
        <div className="rooms-content-luxury">
          <motion.div
            className="empty-state-luxury"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="empty-icon-luxury">❌</div>
            <h3>{error || t('rooms.notFound') || 'Room not found'}</h3>
            <Link to="/rooms" className="room-button-primary-luxury" style={{ display: 'inline-block', marginTop: '1rem' }}>
              {t('rooms.backToRooms') || 'Back to Rooms'}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const amenities = [
    { label: t('amenity.wifi'), icon: '📶', value: room.hasWifi },
    { label: t('amenity.tv'), icon: '📺', value: room.hasTV },
    { label: t('amenity.airConditioning'), icon: '❄️', value: room.hasAirConditioning },
    { label: t('amenity.balcony'), icon: '🌳', value: room.hasBalcony },
  ].filter(a => a.value);

  return (
    <div className="rooms-container-luxury">
      <div className="rooms-content-luxury">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/rooms" className="back-button-luxury">
            ← {t('rooms.backToRooms') || 'Back to Rooms'}
          </Link>
        </motion.div>

        <div className="room-details-layout-luxury">
          {/* Main Content */}
          <motion.div
            className="room-details-main-luxury"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Room Image/Header - Replaced with ImageGallery */}
            <div style={{ marginBottom: '2rem' }}>
              <ImageGallery 
                images={room.imageUrls || []} 
                height="400px" 
                showThumbnails={true}
                allowFullscreen={true}
              />
            </div>
            
            <div style={{ display: 'none' }}> {/* Hidden original header logic but kept for badge reference if needed elsewhere */}
               <div className={`room-status-badge-luxury status-${room.status.toLowerCase()}`}>
                 {room.status}
               </div>
            </div>

            {/* Room Info */}
            <div className="room-details-info-luxury">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="room-details-title-luxury">{t(`roomType.${room.roomType}`) || room.roomType}</h1>
                <p className="room-details-description-luxury">
                  {room.description || `${t('rooms.experience') || 'Experience'} ${t(`roomType.${room.roomType}`) || room.roomType} ${t('rooms.comfort') || 'comfort and style'}. ${t('rooms.perfectFor') || 'Perfect for'} ${room.capacity} ${room.capacity === 1 ? (t('rooms.guest') || 'guest') : (t('rooms.guests') || 'guests')}.`}
                </p>
              </motion.div>

              {/* Room Details Grid */}
              <motion.div
                className="room-details-grid-luxury"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="detail-card-luxury">
                  <div className="detail-card-icon-luxury">👥</div>
                  <div className="detail-card-content-luxury">
                    <h4>{t('rooms.capacity') || 'Capacity'}</h4>
                    <p>{room.capacity} {room.capacity === 1 ? (t('rooms.guest') || 'guest') : (t('rooms.guests') || 'guests')}</p>
                  </div>
                </div>
                <div className="detail-card-luxury">
                  <div className="detail-card-icon-luxury">💰</div>
                  <div className="detail-card-content-luxury">
                    <h4>{t('rooms.pricePerNight') || 'Price per Night'}</h4>
                    <p>{formatPrice(room.pricePerNight)}</p>
                  </div>
                </div>
                <div className="detail-card-luxury">
                  <div className="detail-card-icon-luxury">🏷️</div>
                  <div className="detail-card-content-luxury">
                    <h4>{t('rooms.roomType') || 'Room Type'}</h4>
                    <p>{t(`roomType.${room.roomType}`) || room.roomType}</p>
                  </div>
                </div>
              </motion.div>

              {/* Amenities */}
              {amenities.length > 0 && (
                <motion.div
                  className="room-amenities-section-luxury"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="section-title-luxury">{t('rooms.amenities') || 'Amenities'}</h3>
                  <div className="amenities-grid-luxury">
                    {amenities.map((amenity, idx) => (
                      <motion.div
                        key={idx}
                        className="amenity-item-luxury"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <span className="amenity-icon-luxury">{amenity.icon}</span>
                        <span className="amenity-label-luxury">{amenity.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Booking Sidebar */}
          <motion.div
            className="room-booking-sidebar-luxury"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="booking-card-luxury">
              <h3 className="booking-title-luxury">{t('rooms.bookingInformation') || 'Booking Information'}</h3>
              <div className="booking-price-luxury">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="price-label-luxury" style={{ marginBottom: 0 }}>{t('rooms.standardRate') || 'Standard'}</span>
                  <span className="price-value-luxury" style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: '#A0AEC0' }}>{formatPrice(room.pricePerNight)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="price-label-luxury" style={{ marginBottom: 0, color: '#C9A961', fontWeight: 'bold' }}>{t('rooms.memberPrice') || 'Member Price'}</span>
                  <span className="price-value-luxury">{formatPrice(memberPrice)}</span>
                </div>
                <span className="price-period-luxury" style={{ textAlign: 'right' }}>{t('rooms.perNight') || 'per night'}</span>
              </div>

              {room.status.toLowerCase() === 'available' ? (
                <>
                  {isAuthenticated ? (
                    <>
                      <Link
                        to={`/bookings/create?roomId=${room.id}`}
                        className="room-button-primary-luxury"
                        style={{ width: '100%', marginBottom: '1rem', display: 'block' }}
                      >
                        {t('rooms.bookThisRoom') || 'Book This Room'}
                      </Link>
                    </>
                  ) : (
                    <div className="booking-login-prompt-luxury">
                      <p>{t('rooms.pleaseLogin') || 'Please login to book this room'}</p>
                      <Link to="/login" className="room-button-primary-luxury" style={{ width: '100%', display: 'block' }}>
                        {t('rooms.loginToBook') || 'Login to Book'}
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="booking-unavailable-luxury">
                  <div className="unavailable-icon-luxury">⏸️</div>
                  <p>{t('rooms.currentlyUnavailable') || `This room is currently ${room.status.toLowerCase()}`}</p>
                  <Link to="/rooms" className="room-button-secondary-luxury" style={{ width: '100%', marginTop: '1rem', display: 'block' }}>
                    {t('rooms.browseOtherRooms') || 'Browse Other Rooms'}
                  </Link>
                </div>
              )}

              <div className="booking-features-luxury">
                <div className="booking-feature-luxury">
                  <span>✓</span> {t('rooms.freeCancellation') || 'Free cancellation'}
                </div>
                <div className="booking-feature-luxury">
                  <span>✓</span> {t('rooms.bestPriceGuarantee') || 'Best price guarantee'}
                </div>
                <div className="booking-feature-luxury">
                  <span>✓</span> {t('rooms.instantConfirmation') || 'Instant confirmation'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
