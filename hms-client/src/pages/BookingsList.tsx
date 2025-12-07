import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsApi, Booking } from '../services/api';

const BookingsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isManager, isReceptionist } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const data = await bookingsApi.getAll();
        setBookings(data);
        
        // Show success message if redirected from booking creation
        if (searchParams.get('success') === 'true') {
          // You could show a toast notification here
        }
      } catch (err) {
        setError('Failed to load bookings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, navigate, searchParams]);

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingsApi.cancel(id);
      setBookings(bookings.filter(b => b.id !== id));
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await bookingsApi.updateStatus(id, newStatus);
      setBookings(bookings.map(b => 
        b.id === id ? { ...b, status: newStatus } : b
      ));
    } catch (err) {
      alert('Failed to update booking status');
    }
  };

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status.toLowerCase() === filterStatus.toLowerCase());

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'confirmed') return 'bg-success';
    if (statusLower === 'pending') return 'bg-warning';
    if (statusLower === 'checkedin') return 'bg-info';
    if (statusLower === 'checkedout') return 'bg-secondary';
    if (statusLower === 'cancelled') return 'bg-danger';
    return 'bg-secondary';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          {isManager || isReceptionist ? 'All Bookings' : 'My Bookings'}
        </h2>
        <Link to="/bookings/create" className="btn btn-primary">
          New Booking
        </Link>
      </div>

      {(isManager || isReceptionist) && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-3">
                <label className="form-label">Filter by Status:</label>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checkedin">Checked In</option>
                  <option value="checkedout">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-md-9">
                <div className="d-flex gap-2 flex-wrap">
                  <span className="badge bg-warning">Pending: {bookings.filter(b => b.status.toLowerCase() === 'pending').length}</span>
                  <span className="badge bg-success">Confirmed: {bookings.filter(b => b.status.toLowerCase() === 'confirmed').length}</span>
                  <span className="badge bg-info">Checked In: {bookings.filter(b => b.status.toLowerCase() === 'checkedin').length}</span>
                  <span className="badge bg-secondary">Checked Out: {bookings.filter(b => b.status.toLowerCase() === 'checkedout').length}</span>
                  <span className="badge bg-danger">Cancelled: {bookings.filter(b => b.status.toLowerCase() === 'cancelled').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="alert alert-info">
          <h5>No bookings found</h5>
          <p>
            {filterStatus === 'all' 
              ? 'You don\'t have any bookings yet.'
              : `No bookings with status "${filterStatus}".`}
          </p>
          <Link to="/check-availability" className="btn btn-primary">
            Search for Rooms
          </Link>
        </div>
      ) : (
        <div className="row">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="col-md-6 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="card-title mb-1">
                        Room {booking.room?.roomNumber || `#${booking.roomId}`}
                      </h5>
                      <p className="text-muted mb-0">{booking.room?.roomType}</p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  {(isManager || isReceptionist) && booking.user && (
                    <div className="mb-2">
                      <strong>Guest:</strong> {booking.user.firstName} {booking.user.lastName}
                      <br />
                      <small className="text-muted">{booking.user.email}</small>
                    </div>
                  )}

                  <div className="mb-2">
                    <strong>Check-in:</strong> {formatDate(booking.checkInDate)}
                    <br />
                    <strong>Check-out:</strong> {formatDate(booking.checkOut)}
                    <br />
                    <strong>Guests:</strong> {booking.numberOfGuests}
                    <br />
                    <strong>Total:</strong> ${booking.totalAmount.toFixed(2)}
                  </div>

                  {booking.specialRequests && (
                    <div className="mb-2">
                      <strong>Special Requests:</strong>
                      <p className="text-muted small mb-0">{booking.specialRequests}</p>
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-3">
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      View Details
                    </Link>
                    
                    {(isManager || isReceptionist) && booking.status.toLowerCase() === 'pending' && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusUpdate(booking.id, 'Confirmed')}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() => handleStatusUpdate(booking.id, 'CheckedIn')}
                        >
                          Check In
                        </button>
                      </>
                    )}

                    {(isManager || isReceptionist) && booking.status.toLowerCase() === 'confirmed' && (
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleStatusUpdate(booking.id, 'CheckedIn')}
                      >
                        Check In
                      </button>
                    )}

                    {(isManager || isReceptionist) && booking.status.toLowerCase() === 'checkedin' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusUpdate(booking.id, 'CheckedOut')}
                      >
                        Check Out
                      </button>
                    )}

                    {booking.status.toLowerCase() !== 'cancelled' && 
                     booking.status.toLowerCase() !== 'checkedout' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsList;

