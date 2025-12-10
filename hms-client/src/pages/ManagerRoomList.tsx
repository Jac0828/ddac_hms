import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { roomsApi, Room, roomTypesApi, RoomType } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FeedbackModal, { FeedbackModalProps } from '../components/common/FeedbackModal';
import EditFormModal from '../components/common/EditFormModal';
import { FaPencilAlt, FaTrash, FaList, FaDollarSign, FaCog } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Admin.css'; // Reusing Admin styles for table layout
import './ManagerRoomList.css'; // Import custom styles
import LuxurySelect from '../components/common/LuxurySelect'; // Import LuxurySelect

const ManagerRoomList: React.FC = () => {
  const { isManager, isReceptionist } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalProps>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
  });

  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    roomTypeId: 0,
    pricePerNight: 0,
    status: 'Available',
    description: '',
    capacity: 1,
    hasBalcony: false,
    hasWifi: true,
    hasTV: true,
    hasAirConditioning: true,
  });

  useEffect(() => {
    if (!isManager && !isReceptionist) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isManager, isReceptionist, navigate]);

  useEffect(() => {
    filterRooms();
  }, [rooms, statusFilter, typeFilter, searchQuery]);

  const filterRooms = () => {
    let result = [...rooms];

    // Filter by Status
    if (statusFilter !== 'All') {
      result = result.filter(room => room.status === statusFilter);
    }

    // Filter by Type
    if (typeFilter !== 'All') {
      result = result.filter(room => room.roomType === typeFilter);
    }

    // Filter by Search (Room Number)
    if (searchQuery) {
      result = result.filter(room => 
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRooms(result);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsData, roomTypesData] = await Promise.all([
        roomsApi.getAll().catch(() => []),
        roomTypesApi.getAll().catch(() => [])
      ]);
      setRooms(roomsData);
      setFilteredRooms(roomsData);
      setRoomTypes(roomTypesData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (title: string, message: string) => {
    setFeedbackModal({
      isOpen: true,
      type: 'success',
      title,
      message,
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
    });
    setTimeout(() => {
      setFeedbackModal(prev => {
        if (prev.type === 'success' && prev.title === title) {
          return { ...prev, isOpen: false };
        }
        return prev;
      });
    }, 2000);
  };

  const showError = (title: string, message: string) => {
    setFeedbackModal({
      isOpen: true,
      type: 'error',
      title,
      message,
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...roomFormData };
      if (editingRoom) {
        await roomsApi.update(editingRoom.id, payload);
        showSuccess('Success', 'Room updated successfully');
      } else {
        await roomsApi.create(payload);
        showSuccess('Success', 'Room created successfully');
      }
      setShowRoomForm(false);
      setEditingRoom(null);
      resetRoomForm();
      loadData();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Failed to save room');
    }
  };

  const executeDeleteRoom = async (id: number) => {
    try {
      await roomsApi.delete(id);
      showSuccess('Success', 'Room deleted successfully');
      loadData();
    } catch (err) {
      showError('Error', 'Failed to delete room');
    }
  };

  const handleDeleteRoom = (id: number) => {
    setFeedbackModal({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Room',
      message: 'Are you sure you want to delete this room?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
      onConfirm: () => executeDeleteRoom(id)
    });
  };

  const openEditRoom = (room: Room) => {
    setEditingRoom(room);
    const foundRoomType = roomTypes.find(rt => rt.name === room.roomType);
    setRoomFormData({
      roomNumber: room.roomNumber,
      roomTypeId: foundRoomType ? foundRoomType.id : 0,
      pricePerNight: room.pricePerNight,
      status: room.status,
      description: room.description,
      capacity: room.capacity,
      hasBalcony: room.hasBalcony,
      hasWifi: room.hasWifi,
      hasTV: room.hasTV,
      hasAirConditioning: room.hasAirConditioning,
    });
    setShowRoomForm(true);
  };

  const resetRoomForm = () => {
    setRoomFormData({
      roomNumber: '',
      roomTypeId: 0,
      pricePerNight: 0,
      status: 'Available',
      description: '',
      capacity: 1,
      hasBalcony: false,
      hasWifi: true,
      hasTV: true,
      hasAirConditioning: true,
    });
  };

  const handleRoomTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selectedType = roomTypes.find(rt => rt.id === selectedId);
    if (selectedType) {
      setRoomFormData({
        ...roomFormData,
        roomTypeId: selectedId,
        pricePerNight: selectedType.basePricePerNight,
        capacity: selectedType.maxCapacity,
        description: selectedType.description || '',
        hasWifi: selectedType.amenities?.includes('WiFi') || false,
        hasTV: selectedType.amenities?.includes('TV') || false,
        hasAirConditioning: selectedType.amenities?.includes('Air Conditioning') || false,
        hasBalcony: selectedType.amenities?.includes('Balcony') || false,
      });
    } else {
      setRoomFormData({ ...roomFormData, roomTypeId: selectedId });
    }
  };

  if (loading) return <LoadingSpinner text="Loading Rooms..." />;

  return (
    <div className="dashboard-page" style={{ paddingTop: '2rem', background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 100%)', minHeight: '100vh' }}>
      <div className="container">
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={feedbackModal.onClose}
          type={feedbackModal.type}
          title={feedbackModal.title}
          message={feedbackModal.message}
          onConfirm={feedbackModal.onConfirm}
          confirmText={feedbackModal.confirmText}
          cancelText={feedbackModal.cancelText}
        />

        <EditFormModal
          isOpen={showRoomForm}
          onClose={() => {
            setShowRoomForm(false);
            setEditingRoom(null);
            resetRoomForm();
          }}
          title={editingRoom ? 'Edit Room' : 'Create New Room'}
          onSubmit={handleCreateRoom}
          submitText={editingRoom ? 'Update Room' : 'Create Room'}
          maxWidth="900px"
        >
          {/* Form content same as Admin.tsx */}
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Room Number</label>
              <input 
                type="text" 
                className="form-control" 
                value={roomFormData.roomNumber} 
                onChange={e => setRoomFormData({...roomFormData, roomNumber: e.target.value})} 
                required 
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Room Type</label>
              <LuxurySelect 
                value={roomFormData.roomTypeId} 
                onChange={(value) => handleRoomTypeChange({ target: { value } } as any)} 
                options={[
                  { value: 0, label: 'Select Room Type' },
                  ...roomTypes.map(rt => ({ value: rt.id, label: rt.name }))
                ]}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Price per Night</label>
              <div className="input-group">
                <input 
                  type="number" 
                  className="form-control bg-light" 
                  value={roomFormData.pricePerNight} 
                  readOnly
                />
                <span className="input-group-text bg-light text-muted">
                  <FaDollarSign size={12} />
                </span>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Status</label>
              <LuxurySelect 
                value={roomFormData.status} 
                onChange={(value) => setRoomFormData({...roomFormData, status: value})}
                options={[
                  { value: 'Available', label: 'Available' },
                  { value: 'Occupied', label: 'Occupied' },
                  { value: 'Maintenance', label: 'Maintenance' },
                  { value: 'Cleaning', label: 'Cleaning' },
                ]}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Capacity</label>
              <input 
                type="number" 
                className="form-control" 
                value={roomFormData.capacity} 
                onChange={e => setRoomFormData({...roomFormData, capacity: parseInt(e.target.value)})} 
                min="1"
                required 
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Description</label>
              <input 
                type="text" 
                className="form-control" 
                value={roomFormData.description} 
                onChange={e => setRoomFormData({...roomFormData, description: e.target.value})} 
              />
            </div>
          </div>
          {/* Amenities Checkboxes */}
          <div className="mb-3">
            <label className="form-label">Amenities</label>
            <div className="d-flex gap-3 flex-wrap">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" checked={roomFormData.hasWifi} onChange={(e) => setRoomFormData({ ...roomFormData, hasWifi: e.target.checked })} />
                <label className="form-check-label">WiFi</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" checked={roomFormData.hasTV} onChange={(e) => setRoomFormData({ ...roomFormData, hasTV: e.target.checked })} />
                <label className="form-check-label">TV</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" checked={roomFormData.hasAirConditioning} onChange={(e) => setRoomFormData({ ...roomFormData, hasAirConditioning: e.target.checked })} />
                <label className="form-check-label">Air Conditioning</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" checked={roomFormData.hasBalcony} onChange={(e) => setRoomFormData({ ...roomFormData, hasBalcony: e.target.checked })} />
                <label className="form-check-label">Balcony</label>
              </div>
            </div>
          </div>
        </EditFormModal>

        {/* Filters Section */}
        <div className="filter-card mb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small text-muted text-uppercase fw-bold">Search Room</label>
              <input
                type="text"
                className="form-control filter-input"
                placeholder="Enter room number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted text-uppercase fw-bold">Filter by Status</label>
              <LuxurySelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Available', label: 'Available' },
                  { value: 'Booked', label: 'Booked' },
                  { value: 'Occupied', label: 'Occupied' },
                  { value: 'Cleaning', label: 'Cleaning' },
                  { value: 'Maintenance', label: 'Maintenance' },
                ]}
                placeholder="Select Status"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted text-uppercase fw-bold">Filter by Type</label>
              <LuxurySelect
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: 'All', label: 'All Room Types' },
                  ...roomTypes.map(type => ({ value: type.name, label: type.name }))
                ]}
                placeholder="Select Type"
              />
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          {/* No title here as requested */}
          <div></div> 
          <div className="d-flex gap-2">
            {isManager && (
              <button 
                className="btn btn-primary d-flex align-items-center gap-2" 
                style={{ background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', border: 'none', borderRadius: '10px', padding: '0.6rem 1.5rem', fontWeight: 600 }}
                onClick={() => { setShowRoomForm(true); setEditingRoom(null); resetRoomForm(); }}
              >
                <FaList /> Add New Room
              </button>
            )}
          </div>
        </div>

        <div className="users-table-container">
          <div className="users-table-wrapper">
            <table className="users-table rooms-table-layout">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Capacity</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 6 : 5} className="text-center py-5" style={{ color: '#8B6F47' }}>
                      <p>No rooms found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map(room => (
                    <tr key={room.id}>
                      <td data-label="Room Number" className="fw-bold">{room.roomNumber}</td>
                      <td data-label="Type">{room.roomType}</td>
                      <td data-label="Price">{formatPrice(room.pricePerNight)}</td>
                      <td data-label="Status">
                        <span className={`status-badge status-badge-${room.status.toLowerCase()}`}>
                          {room.status}
                        </span>
                      </td>
                      <td data-label="Capacity">{room.capacity}</td>
                      {isManager && (
                        <td data-label="Actions">
                          <div className="action-buttons">
                            <button className="btn-edit" onClick={() => openEditRoom(room)}><FaPencilAlt /></button>
                            <button className="btn-delete" onClick={() => handleDeleteRoom(room.id)}><FaTrash /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerRoomList;

