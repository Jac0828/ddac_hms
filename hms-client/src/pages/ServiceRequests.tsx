import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { serviceRequestsApi, ServiceRequest } from '../services/api';
import { bookingsApi, Booking } from '../services/api';

const ServiceRequests: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isRoomAttendant, isManager } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    bookingId: '',
    serviceType: '',
    description: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [requestsData, bookingsData] = await Promise.all([
          serviceRequestsApi.getAll(),
          bookingsApi.getAll(),
        ]);
        setRequests(requestsData);
        setBookings(bookingsData.filter(b => 
          b.status.toLowerCase() === 'confirmed' || 
          b.status.toLowerCase() === 'checkedin'
        ));
      } catch (err) {
        setError('Failed to load service requests');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const newRequest = await serviceRequestsApi.create({
        bookingId: parseInt(formData.bookingId),
        serviceType: formData.serviceType,
        description: formData.description,
      });
      setRequests([...requests, newRequest]);
      setShowCreateForm(false);
      setFormData({ bookingId: '', serviceType: '', description: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create service request');
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await serviceRequestsApi.updateStatus(id, status);
      setRequests(requests.map(r => 
        r.id === id ? { ...r, status } : r
      ));
    } catch (err) {
      alert('Failed to update service request status');
    }
  };

  const filteredRequests = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status.toLowerCase() === filterStatus.toLowerCase());

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed') return 'bg-success';
    if (statusLower === 'inprogress') return 'bg-info';
    if (statusLower === 'pending') return 'bg-warning';
    if (statusLower === 'cancelled') return 'bg-danger';
    return 'bg-secondary';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <h2>Service Requests</h2>
        {!isRoomAttendant && !isManager && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'New Request'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title">Create Service Request</h5>
            <form onSubmit={handleCreateRequest}>
              {error && <div className="alert alert-danger">{error}</div>}
              
              <div className="mb-3">
                <label htmlFor="bookingId" className="form-label">Booking</label>
                <select
                  className="form-select"
                  id="bookingId"
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                  required
                >
                  <option value="">Select a booking</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      Room {booking.room?.roomNumber} - {new Date(booking.checkInDate).toLocaleDateString()} to {new Date(booking.checkOutDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="serviceType" className="form-label">Service Type</label>
                <select
                  className="form-select"
                  id="serviceType"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  required
                >
                  <option value="">Select service type</option>
                  <option value="RoomService">Room Service</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Laundry">Laundry</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Describe your service request..."
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {(isRoomAttendant || isManager) && (
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
                  <option value="inprogress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredRequests.length === 0 ? (
        <div className="alert alert-info">
          <h5>No service requests found</h5>
          <p>
            {filterStatus === 'all'
              ? 'You don\'t have any service requests yet.'
              : `No requests with status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="row">
          {filteredRequests.map((request) => (
            <div key={request.id} className="col-md-6 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="card-title mb-1">{request.serviceType}</h5>
                      {request.booking && (
                        <p className="text-muted mb-0">
                          Room {request.booking.room?.roomNumber}
                        </p>
                      )}
                    </div>
                    <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <p className="card-text">{request.description}</p>

                  <div className="mb-2">
                    <small className="text-muted">
                      <strong>Requested:</strong> {formatDate(request.requestedAt)}
                    </small>
                    {request.completedAt && (
                      <>
                        <br />
                        <small className="text-muted">
                          <strong>Completed:</strong> {formatDate(request.completedAt)}
                        </small>
                      </>
                    )}
                  </div>

                  {(isRoomAttendant || isManager) && request.user && (
                    <div className="mb-2">
                      <small>
                        <strong>Guest:</strong> {request.user.firstName} {request.user.lastName}
                      </small>
                    </div>
                  )}

                  {request.notes && (
                    <div className="mb-2">
                      <small className="text-muted">
                        <strong>Notes:</strong> {request.notes}
                      </small>
                    </div>
                  )}

                  {(isRoomAttendant || isManager) && request.status.toLowerCase() === 'pending' && (
                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleStatusUpdate(request.id, 'InProgress')}
                      >
                        Start
                      </button>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusUpdate(request.id, 'Completed')}
                      >
                        Complete
                      </button>
                    </div>
                  )}

                  {(isRoomAttendant || isManager) && request.status.toLowerCase() === 'inprogress' && (
                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusUpdate(request.id, 'Completed')}
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceRequests;

