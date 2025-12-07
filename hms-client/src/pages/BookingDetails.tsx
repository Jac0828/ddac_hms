import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsApi, Booking } from '../services/api';
import { roomsApi, Room } from '../services/api';

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isManager, isReceptionist } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchBooking = async () => {
      try {
        if (!id) return;
        const bookingData = await bookingsApi.getById(parseInt(id));
        setBooking(bookingData);
        
        // Fetch room details if not included
        if (bookingData.roomId && !bookingData.room) {
          try {
            const roomData = await roomsApi.getById(bookingData.roomId);
            setRoom(roomData);
          } catch (err) {
            console.error('Failed to load room details:', err);
          }
        } else if (bookingData.room) {
          // If room is included but incomplete, fetch full details
          try {
            const roomData = await roomsApi.getById(bookingData.room.id);
            setRoom(roomData);
          } catch (err) {
            console.error('Failed to load room details:', err);
          }
        }
      } catch (err) {
        setError('Failed to load booking details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, isAuthenticated, navigate]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;
    
    if (!window.confirm(`Are you sure you want to update status to "${newStatus}"?`)) {
      return;
    }

    try {
      await bookingsApi.updateStatus(booking.id, newStatus);
      setBooking({ ...booking, status: newStatus });
    } catch (err) {
      alert('Failed to update booking status');
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingsApi.cancel(booking.id);
      navigate('/bookings');
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const nights = Math.ceil(
      (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    return nights > 0 ? nights : 0;
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

  if (error || !booking) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          {error || 'Booking not found'}
        </div>
        <Link to="/bookings" className="btn btn-primary">
          Back to Bookings
        </Link>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'confirmed') return 'bg-success';
    if (statusLower === 'pending') return 'bg-warning';
    if (statusLower === 'checkedin') return 'bg-info';
    if (statusLower === 'checkedout') return 'bg-secondary';
    if (statusLower === 'cancelled') return 'bg-danger';
    return 'bg-secondary';
  };

  return (
    <div className="container mt-5">
      <Link to="/bookings" className="btn btn-outline-secondary mb-3">
        ← Back to Bookings
      </Link>

      <div className="row">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Booking Details</h4>
              <span className={`badge ${getStatusBadgeClass(booking.status)} fs-6`}>
                {booking.status}
              </span>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h5>Room Information</h5>
                  <p className="mb-1">
                    <strong>Room Number:</strong> {booking.room?.roomNumber || `#${booking.roomId}`}
                  </p>
                  <p className="mb-1">
                    <strong>Room Type:</strong> {booking.room?.roomType || 'N/A'}
                  </p>
                  {room && (
                    <>
                      <p className="mb-1">
                        <strong>Price per Night:</strong> ${room.pricePerNight.toFixed(2)}
                      </p>
                      <p className="mb-0">
                        <strong>Capacity:</strong> {room.capacity} guests
                      </p>
                    </>
                  )}
                </div>
                <div className="col-md-6">
                  <h5>Booking Information</h5>
                  <p className="mb-1">
                    <strong>Check-in:</strong> {formatDate(booking.checkInDate)}
                  </p>
                  <p className="mb-1">
                    <strong>Check-out:</strong> {formatDate(booking.checkOutDate)}
                  </p>
                  <p className="mb-1">
                    <strong>Nights:</strong> {calculateNights()}
                  </p>
                  <p className="mb-1">
                    <strong>Guests:</strong> {booking.numberOfGuests}
                  </p>
                  <p className="mb-0">
                    <strong>Total Amount:</strong> ${booking.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {(isManager || isReceptionist) && booking.user && (
                <div className="mb-3">
                  <h5>Guest Information</h5>
                  <p className="mb-1">
                    <strong>Name:</strong> {booking.user.firstName} {booking.user.lastName}
                  </p>
                  <p className="mb-0">
                    <strong>Email:</strong> {booking.user.email}
                  </p>
                </div>
              )}

              {booking.specialRequests && (
                <div className="mb-3">
                  <h5>Special Requests</h5>
                  <p className="text-muted">{booking.specialRequests}</p>
                </div>
              )}

              {room && (
                <div className="mb-3">
                  <h5>Room Amenities</h5>
                  <div className="d-flex flex-wrap gap-2">
                    {room.hasWifi && <span className="badge bg-info">WiFi</span>}
                    {room.hasTV && <span className="badge bg-info">TV</span>}
                    {room.hasAirConditioning && <span className="badge bg-info">AC</span>}
                    {room.hasBalcony && <span className="badge bg-info">Balcony</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5>Actions</h5>
              
              {(isManager || isReceptionist) && booking.status.toLowerCase() === 'pending' && (
                <>
                  <button
                    className="btn btn-success w-100 mb-2"
                    onClick={() => handleStatusUpdate('Confirmed')}
                  >
                    Confirm Booking
                  </button>
                  <button
                    className="btn btn-info w-100 mb-2"
                    onClick={() => handleStatusUpdate('CheckedIn')}
                  >
                    Check In
                  </button>
                </>
              )}

              {(isManager || isReceptionist) && booking.status.toLowerCase() === 'confirmed' && (
                <button
                  className="btn btn-info w-100 mb-2"
                  onClick={() => handleStatusUpdate('CheckedIn')}
                >
                  Check In
                </button>
              )}

              {(isManager || isReceptionist) && booking.status.toLowerCase() === 'checkedin' && (
                <button
                  className="btn btn-secondary w-100 mb-2"
                  onClick={() => handleStatusUpdate('CheckedOut')}
                >
                  Check Out
                </button>
              )}

              {booking.status.toLowerCase() !== 'cancelled' && 
               booking.status.toLowerCase() !== 'checkedout' && (
                <button
                  className="btn btn-danger w-100"
                  onClick={handleCancel}
                >
                  Cancel Booking
                </button>
              )}

              {room && (
                <Link
                  to={`/rooms/${room.id}`}
                  className="btn btn-outline-primary w-100 mt-2"
                >
                  View Room Details
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;

