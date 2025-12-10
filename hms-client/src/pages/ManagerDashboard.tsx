import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { bookingsApi, Booking } from '../services/api';
import { roomsApi, Room } from '../services/api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/dashboard/StatsCard';
import { FaBuilding, FaCalendarAlt, FaChartLine, FaMoneyBillWave, FaCog, FaList, FaClipboardList, FaUserTie, FaQuoteLeft } from 'react-icons/fa';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../components/dashboard/Dashboard.css';

const ManagerDashboard: React.FC = () => {
  const { isManager } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    totalBookings: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    revenue: 0,
    occupancyRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isManager) {
      navigate('/dashboard');
      return;
    }
    loadDashboardData();
  }, [isManager, navigate]);

  const loadDashboardData = async () => {
    try {
      const [rooms, bookings] = await Promise.all([
        roomsApi.getAll().catch(() => []),
        bookingsApi.getAll().catch(() => []),
        // roomTypesApi.getAll().catch(() => []), // Not used for stats calculation currently
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const availableRooms = rooms.filter((r: Room) => r.status === 'Available').length;
      const occupiedRooms = rooms.filter((r: Room) => 
        r.status === 'Booked' || r.status === 'Occupied'
      ).length;

      const todayCheckIns = bookings.filter((b: Booking) => {
        const checkIn = new Date(b.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime() && 
               (b.status === 'Confirmed' || b.status === 'Pending');
      }).length;

      const todayCheckOuts = bookings.filter((b: Booking) => {
        const checkOut = new Date(b.checkOutDate);
        checkOut.setHours(0, 0, 0, 0);
        return checkOut.getTime() === today.getTime() && 
               b.status === 'CheckedIn';
      }).length;

      const revenue = bookings
        .filter((b: Booking) => b.status !== 'Cancelled')
        .reduce((sum: number, b: Booking) => sum + ((b as any).totalPrice || b.totalAmount || 0), 0);

      const occupancyRate = rooms.length > 0 
        ? Number(((occupiedRooms / rooms.length) * 100).toFixed(1))
        : 0;

      setStats({
        totalRooms: rooms.length,
        availableRooms,
        occupiedRooms,
        totalBookings: bookings.length,
        todayCheckIns,
        todayCheckOuts,
        revenue,
        occupancyRate,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isManager) {
    return null;
  }

  return (
    <div className="dashboard-page">
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <LoadingSpinner text="Loading Dashboard..." />
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="row g-4 mb-5">
              <div className="col-md-3">
                <StatsCard
                  title={t('dashboard.totalRevenue')}
                  value={`$${stats.revenue.toFixed(2)}`}
                  icon={<FaMoneyBillWave />}
                />
              </div>
              <div className="col-md-3">
                <StatsCard
                  title={t('dashboard.totalBookings')}
                  value={stats.totalBookings}
                  icon={<FaCalendarAlt />}
                />
              </div>
              <div className="col-md-3">
                <StatsCard
                  title={t('dashboard.occupancyRate')}
                  value={`${stats.occupancyRate}%`}
                  icon={<FaChartLine />}
                />
              </div>
              <div className="col-md-3">
                <StatsCard
                  title={t('dashboard.availableRooms')}
                  value={stats.availableRooms}
                  icon={<FaBuilding />}
                />
              </div>
            </div>

            {/* Management Tools */}
            <motion.div
              className="action-card-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h5 className="action-card-title">{t('dashboard.managementTools')}</h5>
              <div className="row g-4 row-cols-2 row-cols-md-6">
                <div className="col">
                  <button
                    className="action-button h-100"
                          onClick={() => navigate('/manager/rooms')}
                        >
                          <FaList />
                          <span>{t('nav.rooms')}</span>
                        </button>
                      </div>
                      <div className="col">
                        <button
                          className="action-button h-100"
                          onClick={() => navigate('/manager/staff')}
                        >
                          <FaUserTie />
                          <span>{t('nav.staff')}</span>
                        </button>
                      </div>
                      <div className="col">
                        <button
                          className="action-button h-100"
                          onClick={() => navigate('/manager/room-types')}
                  >
                    <FaCog />
                    <span>{t('nav.roomTypes')}</span>
                  </button>
                </div>
                <div className="col">
                  <button
                    className="action-button h-100"
                    onClick={() => navigate('/bookings')}
                  >
                    <FaCalendarAlt />
                    <span>{t('nav.bookings')}</span>
                  </button>
                </div>
                <div className="col">
                  <button
                    className="action-button h-100"
                    onClick={() => navigate('/manager/duty-roster')}
                  >
                    <FaClipboardList />
                    <span>{t('nav.dutyRoster')}</span>
                  </button>
                </div>
                <div className="col">
                  <button
                    className="action-button h-100"
                    onClick={() => navigate('/manager/reviews')}
                  >
                    <FaQuoteLeft />
                    <span>{t('reviews.title') || 'Reviews'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
