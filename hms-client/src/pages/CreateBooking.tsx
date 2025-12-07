import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roomsApi, bookingsApi, Room } from '../services/api';
import './Admin.css'; // Reuse styles for consistency

const CreateBooking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  
  const roomIdParam = searchParams.get('roomId');
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');

  const [room, setRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState(checkInParam || '');
  const [checkOut, setCheckOut] = useState(checkOutParam || '');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(!!roomIdParam);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Set default dates if not provided
    if (!checkIn) {
      const today = new Date();
      setCheckIn(today.toISOString().split('T')[0]);
    }
    if (!checkOut) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCheckOut(tomorrow.toISOString().split('T')[0]);
    }

    // Load room if roomId is provided
    if (roomIdParam) {
      const fetchRoom = async () => {
        try {
          const data = await roomsApi.getById(parseInt(roomIdParam));
          setRoom(data);
          setNumberOfGuests(Math.min(data.capacity, 2));
        } catch (err) {
          setError('Failed to load room details');
        } finally {
          setLoadingRoom(false);
        }
      };
      fetchRoom();
    }
  }, [roomIdParam, isAuthenticated, navigate, checkInParam, checkOutParam]);

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const calculateTotal = () => {
    if (!room) return 0;
    return room.pricePerNight * calculateNights();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!room) {
      setError('Please select a room');
      return;
    }

    if (numberOfGuests > room.capacity) {
      setError(`This room can only accommodate ${room.capacity} guests`);
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out date must be after check-in date');
      return;
    }

    setLoading(true);

    try {
      await bookingsApi.create({
        roomId: room.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests,
        specialRequests: specialRequests.trim() || undefined,
      });
      
      navigate('/bookings?success=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loadingRoom) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', position: 'relative', padding: '2rem 0' }}>
      <div className="container">
        <h2 className="mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C' }}>Create Booking</h2>

        <div className="row">
          <div className="col-md-8">
            <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger">{error}</div>
                  )}

                  {!room && (
                    <div className="alert alert-info">
                      <Link to="/check-availability" className="btn btn-primary">
                        Search for Available Rooms
                      </Link>
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="checkIn" className="form-label">Check-in Date</label>
                      <input
                        type="date"
                        className="form-control"
                        id="checkIn"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="checkOut" className="form-label">Check-out Date</label>
                      <input
                        type="date"
                        className="form-control"
                        id="checkOut"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        min={checkIn || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  {room && (
                    <div className="mb-3">
                      <label htmlFor="numberOfGuests" className="form-label">
                        Number of Guests (Max: {room.capacity})
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="numberOfGuests"
                        value={numberOfGuests}
                        onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                        min={1}
                        max={room.capacity}
                        required
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="specialRequests" className="form-label">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      id="specialRequests"
                      rows={4}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special requests or notes..."
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', border: 'none' }}
                      disabled={loading || !room}
                    >
                      {loading ? 'Creating Booking...' : 'Confirm Booking'}
                    </button>
                    <Link to="/rooms" className="btn btn-secondary">
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm border-0 sticky-top" style={{ borderRadius: '16px', top: '2rem' }}>
              <div className="card-body p-4">
                <h5 style={{ fontFamily: 'Playfair Display, serif' }}>Booking Summary</h5>
                <hr style={{ borderColor: 'rgba(201, 169, 97, 0.3)' }} />
                {room ? (
                  <>
                    {room.imageUrls && room.imageUrls.length > 0 && (
                      <div className="mb-3 rounded overflow-hidden shadow-sm" style={{ height: '180px' }}>
                        <img 
                          src={room.imageUrls[0]} 
                          alt={room.roomType} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    )}
                    <div className="d-flex justify-content-between mb-2">
                      <span>Room:</span>
                      <strong>{room.roomNumber}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Type:</span>
                      <span>{room.roomType}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Nights:</span>
                      <span>{calculateNights()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Price/Night:</span>
                      <span>${room.pricePerNight.toFixed(2)}</span>
                    </div>
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mb-3 mt-3">
                        <small className="text-muted d-block mb-1">Included:</small>
                        <div className="d-flex flex-wrap gap-1">
                          {room.amenities.slice(0, 4).map(a => (
                            <span key={a} className="badge bg-light text-dark border" style={{ fontSize: '0.65rem' }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <hr style={{ borderColor: 'rgba(201, 169, 97, 0.3)' }} />
                    <div className="d-flex justify-content-between align-items-center">
                      <strong style={{ fontSize: '1.1rem' }}>Total:</strong>
                      <strong style={{ fontSize: '1.5rem', color: '#8B6F47' }}>${calculateTotal().toFixed(2)}</strong>
                    </div>
                  </>
                ) : (
                  <p className="text-muted">Select a room to see booking summary</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;
