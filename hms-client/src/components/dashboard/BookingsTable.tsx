import React from 'react';
import { format } from 'date-fns';
import { Booking } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import './Dashboard.css';

interface BookingsTableProps {
  bookings?: Booking[];
}

const BookingsTable: React.FC<BookingsTableProps> = ({ bookings = [] }) => {
  const { t } = useLanguage();

  // Get latest 5 bookings
  const latestBookings = bookings
    .sort((a, b) => {
      const dateA = new Date(a.checkInDate || a.createdAt || '');
      const dateB = new Date(b.checkInDate || b.createdAt || '');
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    
    const badges: { [key: string]: { class: string; text: string } } = {
      confirmed: { class: 'bg-success', text: t('dashboard.statusConfirmed') },
      pending: { class: 'bg-warning', text: t('dashboard.statusPending') },
      cancelled: { class: 'bg-danger', text: t('dashboard.statusCancelled') },
      'checked-in': { class: 'bg-info', text: t('dashboard.statusCheckedIn') },
      checkedout: { class: 'bg-secondary', text: t('dashboard.statusCheckedOut') },
    };
    const badge = badges[statusLower] || badges.pending;
    return (
      <span className={`badge ${badge.class} text-white`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="bookings-table-card card border-0 shadow-sm">
      <div className="card-header bg-white border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="card-title mb-1 fw-bold">{t('dashboard.latestBookings')}</h5>
            <p className="text-muted small mb-0">{t('dashboard.recentActivities')}</p>
          </div>
          <a href="#" className="btn btn-sm btn-outline-primary">
            {t('dashboard.viewAll')}
          </a>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th className="border-0 ps-4" style={{ width: '15%' }}>{t('dashboard.bookingId')}</th>
                <th className="border-0" style={{ width: '25%' }}>{t('dashboard.customerName')}</th>
                <th className="border-0" style={{ width: '20%' }}>{t('dashboard.room')}</th>
                <th className="border-0" style={{ width: '20%' }}>{t('dashboard.checkIn')}</th>
                <th className="border-0 pe-4" style={{ width: '20%' }}>{t('dashboard.status')}</th>
              </tr>
            </thead>
            <tbody>
              {latestBookings.length > 0 ? (
                latestBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="ps-4 fw-semibold">BK-{String(booking.id).padStart(3, '0')}</td>
                    <td>{booking.userEmail || 'N/A'}</td>
                    <td>
                      <span className="text-muted">{booking.roomNumber || booking.roomType || 'N/A'}</span>
                    </td>
                    <td>{booking.checkInDate ? format(new Date(booking.checkInDate), 'MMM dd, yyyy') : 'N/A'}</td>
                    <td className="pe-4">{getStatusBadge(booking.status || 'pending')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    {t('dashboard.noBookings')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingsTable;
