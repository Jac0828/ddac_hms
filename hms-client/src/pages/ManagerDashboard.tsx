import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingsApi, Booking } from '../services/api';
import { roomsApi, Room } from '../services/api';
import { roomTypesApi, RoomType } from '../services/api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/dashboard/StatsCard';
import { FaBuilding, FaCalendarAlt, FaChartLine, FaMoneyBillWave, FaCog, FaList, FaUsers, FaClipboardList } from 'react-icons/fa';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Admin.css'; // Use Admin styles for consistency

const ManagerDashboard: React.FC = () => {
  const { isManager, user } = useAuth();
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
      const [rooms, bookings, roomTypes] = await Promise.all([
        roomsApi.getAll().catch(() => []),
        bookingsApi.getAll().catch(() => []),
        roomTypesApi.getAll().catch(() => []),
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
    <div className="dashboard-page" style={{ minHeight: '100vh', position: 'relative', padding: '2rem 0' }}>
      <div className="container">
        <div className="mb-5">
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C', marginBottom: '0.5rem' }}>Manager Dashboard</h2>
          <p className="text-muted mb-0">Overview & Operations</p>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading Dashboard..." />
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="stats-grid">
              <StatsCard
                title="Total Revenue"
                value={`$${stats.revenue.toFixed(2)}`}
                icon={<FaMoneyBillWave />}
                iconColor="#C9A961"
              />
              <StatsCard
                title="Total Bookings"
                value={stats.totalBookings}
                change={undefined}
                icon={<FaCalendarAlt />}
                iconColor="#8B6F47"
              />
              <StatsCard
                title="Occupancy Rate"
                value={`${stats.occupancyRate}%`}
                icon={<FaChartLine />}
                iconColor="#D4AF37"
              />
              <StatsCard
                title="Available Rooms"
                value={stats.availableRooms}
                icon={<FaBuilding />}
                iconColor="#B8941F"
              />
            </div>

            {/* Quick Actions */}
            <motion.div
              className="card shadow-sm mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ borderRadius: '16px', border: '1px solid rgba(201, 169, 97, 0.2)', background: 'rgba(255, 255, 255, 0.8)' }}
            >
              <div className="card-body p-4">
                <h5 className="card-title mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Management Tools</h5>
                <div className="row g-3">
                  <div className="col-md-3">
                    <button
                      className="btn btn-outline-primary w-100 p-3 d-flex flex-column align-items-center gap-2 h-100"
                      onClick={() => navigate('/admin?tab=rooms')}
                      style={{ borderColor: '#C9A961', color: '#8B6F47', borderRadius: '12px' }}
                    >
                      <FaList size={24} />
                      <span>Room List</span>
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button
                      className="btn btn-outline-primary w-100 p-3 d-flex flex-column align-items-center gap-2 h-100"
                      onClick={() => navigate('/manager/room-types')}
                      style={{ borderColor: '#C9A961', color: '#8B6F47', borderRadius: '12px' }}
                    >
                      <FaCog size={24} />
                      <span>Room Types & Pricing</span>
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button
                      className="btn btn-outline-primary w-100 p-3 d-flex flex-column align-items-center gap-2 h-100"
                      onClick={() => navigate('/admin?tab=bookings')}
                      style={{ borderColor: '#C9A961', color: '#8B6F47', borderRadius: '12px' }}
                    >
                      <FaCalendarAlt size={24} />
                      <span>Manage Bookings</span>
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button
                      className="btn btn-outline-primary w-100 p-3 d-flex flex-column align-items-center gap-2 h-100"
                      onClick={() => navigate('/manager/duty-roster')}
                      style={{ borderColor: '#C9A961', color: '#8B6F47', borderRadius: '12px' }}
                    >
                      <FaClipboardList size={24} />
                      <span>Staff Duty Roster</span>
                    </button>
                  </div>
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
