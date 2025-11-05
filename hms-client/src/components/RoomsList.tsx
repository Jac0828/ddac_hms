import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roomsApi, Room } from '../services/api';

const RoomsList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomsApi.getAll();
        setRooms(data);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return <div className="container mt-5 text-center">Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Available Rooms</h2>
        <Link to="/check-availability" className="btn btn-primary">
          Check Availability
        </Link>
      </div>
      <div className="row">
        {rooms.map((room) => (
          <div key={room.id} className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Room {room.roomNumber}</h5>
                <p className="card-text">
                  <strong>Type:</strong> {room.roomType}<br />
                  <strong>Price:</strong> ${room.pricePerNight}/night<br />
                  <strong>Capacity:</strong> {room.capacity} guests<br />
                  <strong>Status:</strong>{' '}
                  <span
                    className={`badge bg-${room.status === 'Available' ? 'success' : 'warning'}`}
                  >
                    {room.status}
                  </span>
                </p>
                <p className="card-text">
                  <small className="text-muted">{room.description}</small>
                </p>
                <div className="mb-2">
                  {room.hasWifi && <span className="badge bg-info me-1">WiFi</span>}
                  {room.hasTV && <span className="badge bg-info me-1">TV</span>}
                  {room.hasAirConditioning && (
                    <span className="badge bg-info me-1">AC</span>
                  )}
                  {room.hasBalcony && <span className="badge bg-info me-1">Balcony</span>}
                </div>
                <Link to={`/rooms/${room.id}`} className="btn btn-outline-primary btn-sm">
                  View Details
                </Link>
                {room.status === 'Available' && isAuthenticated && (
                  <Link
                    to={`/bookings/create?roomId=${room.id}`}
                    className="btn btn-primary btn-sm ms-2"
                  >
                    Book Now
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {rooms.length === 0 && (
        <div className="alert alert-info">
          <h4>No rooms found</h4>
          <p>Please check back later or contact us for more information.</p>
        </div>
      )}
    </div>
  );
};

export default RoomsList;

