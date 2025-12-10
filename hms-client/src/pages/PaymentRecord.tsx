import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { paymentApi, Payment } from '../services/api';
import { format } from 'date-fns';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Admin.css';

const PaymentRecord: React.FC = () => {
  const { isManager, isReceptionist } = useAuth();
  const { t } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isManager || isReceptionist) {
      loadData();
    }
  }, [isManager, isReceptionist]);

  const loadData = async () => {
    setLoading(true);
    try {
      const paymentsData = await paymentApi.getAll().catch(() => []);
      setPayments(paymentsData);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isManager && !isReceptionist) {
    return <div className="container mt-5"><div className="alert alert-danger">{t('payment.accessDenied') || 'Access denied'}</div></div>;
  }


  return (
    <div className="dashboard-page" style={{ paddingTop: '2rem', minHeight: '100vh' }}>
      <div className="container">
        <div className="mb-4">
          <h4 style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C', margin: 0 }}>
            {t('payment.title') || 'Payment Records'}
          </h4>
          <p className="text-muted small mb-0 mt-1">
            {t('payment.subtitle') || 'View all payment records in the system'}
          </p>
        </div>

        {loading ? (
          <LoadingSpinner text={t('payment.loading') || 'Loading payments...'} />
        ) : (
          <div className="users-table-container">
            <div className="users-table-header">
              <h5 className="m-0" style={{ color: '#C9A961', fontFamily: 'Playfair Display, serif' }}>
                {t('payment.history') || 'Payment History'}
              </h5>
            </div>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('payment.date') || 'Date'}</th>
                    <th>{t('payment.booking') || 'Booking'}</th>
                    <th>{t('payment.customer') || 'Customer'}</th>
                    <th>{t('payment.amount') || 'Amount'}</th>
                    <th>{t('payment.method') || 'Method'}</th>
                    <th>{t('payment.status') || 'Status'}</th>
                    <th>{t('payment.transactionId') || 'Transaction ID'}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{format(new Date(payment.transactionDate), 'MMM d, yyyy HH:mm')}</td>
                        <td>{t('bookings.room') || 'Room'} {payment.bookingRoomNumber}</td>
                        <td>{payment.customerEmail}</td>
                        <td className="fw-bold">${payment.amount.toFixed(2)}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: '#F5F1E8',
                              color: '#8B6F47',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                            }}
                          >
                            {payment.paymentMethod}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              payment.status === 'Paid'
                                ? 'bg-success'
                                : payment.status === 'Pending'
                                ? 'bg-warning text-dark'
                                : payment.status === 'Refunded'
                                ? 'bg-info'
                                : 'bg-danger'
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {payment.transactionId || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        {t('payment.noRecords') || 'No payment records found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentRecord;
