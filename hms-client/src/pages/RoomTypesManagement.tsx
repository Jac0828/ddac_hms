import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { roomTypesApi, roomsApi, RoomType } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaMagic } from 'react-icons/fa';
import './Admin.css'; // Reuse Admin styles for consistency
import FeedbackModal, { FeedbackModalProps } from '../components/common/FeedbackModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EditFormModal from '../components/common/EditFormModal';
import ImageUpload from '../components/common/ImageUpload';
import LuxurySelect from '../components/common/LuxurySelect'; // Import LuxurySelect

// Define exchange rates
const exchangeRates: Record<string, number> = {
  USD: 1.0,
  CNY: 7.2,
  JPY: 150.0,
  EUR: 0.92,
  GBP: 0.79,
  KRW: 1300.0,
  SGD: 1.35,
  HKD: 7.8,
  THB: 35.0,
  AUD: 1.5,
  CAD: 1.35,
};

const RoomTypesManagement: React.FC = () => {
  const { isManager, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  
  // Modal state
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalProps>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePricePerNight: 0,
    maxCapacity: 1,
    size: '',
    imageUrls: [] as string[],
    amenities: [] as string[],
  });

  // Price input state
  const [inputPrice, setInputPrice] = useState<string>('');
  const [inputCurrency, setInputCurrency] = useState<string>('USD');

  const [batchData, setBatchData] = useState({
    roomNumberRange: '',
    pricePerNight: '', // Optional override
  });

  // Common amenities list for quick selection
  const commonAmenities = [
    'WiFi', 'TV', 'Air Conditioning', 'Balcony', 'Mini Bar', 'Safe', 
    'Room Service', 'Bathtub', 'Sea View', 'Mountain View', 'Coffee Maker'
  ];

  useEffect(() => {
    if (!isManager && !isAdmin) return;
    loadRoomTypes();
  }, [isManager, isAdmin]);

  const loadRoomTypes = async () => {
    setLoading(true);
    try {
      const data = await roomTypesApi.getAll();
      setRoomTypes(data);
    } catch (err) {
      console.error('Failed to load room types:', err);
      showError('Error', 'Failed to load room types');
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
    // Auto-close success modal after 2 seconds
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty image URLs
      const cleanedData = {
        ...formData,
        imageUrls: formData.imageUrls.filter(url => url.trim() !== ''),
      };

      if (editingId) {
        await roomTypesApi.update(editingId, cleanedData);
        showSuccess('Success', 'Room type updated successfully');
      } else {
        await roomTypesApi.create(cleanedData);
        showSuccess('Success', 'Room type created successfully');
      }
      resetForm();
      loadRoomTypes();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Failed to save room type');
    }
  };

  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomTypeId) return;

    try {
      const price = batchData.pricePerNight ? parseFloat(batchData.pricePerNight) : undefined;
      await roomsApi.batchCreate({
        roomTypeId: selectedRoomTypeId,
        roomNumberRange: batchData.roomNumberRange,
        pricePerNight: price,
      });
      
      showSuccess('Success', `Rooms ${batchData.roomNumberRange} created successfully!`);
      setShowBatchModal(false);
      setBatchData({ roomNumberRange: '', pricePerNight: '' });
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Failed to batch create rooms');
    }
  };

  const handleEdit = (roomType: RoomType) => {
    setEditingId(roomType.id);
    setFormData({
      name: roomType.name,
      description: roomType.description || '',
      basePricePerNight: roomType.basePricePerNight,
      maxCapacity: roomType.maxCapacity,
      size: roomType.size || '',
      imageUrls: roomType.imageUrls || [],
      amenities: roomType.amenities || [],
    });
    // Initial price input state
    setInputCurrency('USD');
    setInputPrice(roomType.basePricePerNight.toString());
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setFeedbackModal({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Room Type',
      message: 'Are you sure you want to delete this room type? This will fail if there are rooms assigned to it.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        try {
          await roomTypesApi.delete(id);
          showSuccess('Success', 'Room type deleted successfully');
          loadRoomTypes();
        } catch (err: any) {
          showError('Error', err.response?.data?.message || 'Failed to delete room type');
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      basePricePerNight: 0,
      maxCapacity: 1,
      size: '',
      imageUrls: [],
      amenities: [],
    });
    setInputCurrency('USD');
    setInputPrice('');
    setEditingId(null);
    setShowForm(false);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputPrice(val);
    if (val) {
      const usdValue = parseFloat(val) / exchangeRates[inputCurrency];
      setFormData(prev => ({ ...prev, basePricePerNight: usdValue }));
    } else {
      setFormData(prev => ({ ...prev, basePricePerNight: 0 }));
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    setInputCurrency(newCurrency);
    if (inputPrice) {
      const usdValue = parseFloat(inputPrice) / exchangeRates[newCurrency];
      setFormData(prev => ({ ...prev, basePricePerNight: usdValue }));
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
    }
  };

  if (!isManager && !isAdmin) {
    return <div className="container mt-5"><div className="alert alert-danger">Access denied</div></div>;
  }

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', position: 'relative', padding: '2rem 0' }}>
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

      {/* Batch Create Modal */}
      <EditFormModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="Batch Create Rooms"
        onSubmit={handleBatchCreate}
        submitText="Create Rooms"
        maxWidth="600px"
      >
        <div className="mb-3 text-start">
          <label className="form-label">Room Number Range</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. 101-105, 201, 202"
            value={batchData.roomNumberRange}
            onChange={(e) => setBatchData({ ...batchData, roomNumberRange: e.target.value })}
            required
          />
          <small className="text-muted">Enter a range (101-105) or comma separated values (201, 205)</small>
        </div>
        <div className="mb-4 text-start">
          <label className="form-label">Override Price (Optional)</label>
          <input 
            type="number" 
            className="form-control" 
            placeholder="Leave empty to use Room Type default"
            value={batchData.pricePerNight}
            onChange={(e) => setBatchData({ ...batchData, pricePerNight: e.target.value })}
          />
        </div>
      </EditFormModal>

      {/* Room Type Edit Modal */}
      <EditFormModal
        isOpen={showForm}
        onClose={resetForm}
        title={editingId ? 'Edit Room Type' : 'Create New Room Type'}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update Room Type' : 'Create Room Type'}
        maxWidth="700px"
      >
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Deluxe King Suite"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Base Price</label>
            <div className="input-group">
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={inputPrice}
                onChange={handlePriceChange}
                required
                placeholder="0.00"
              />
              <LuxurySelect 
                value={inputCurrency} 
                onChange={(value) => handleCurrencyChange({ target: { value } } as any)} 
                options={Object.keys(exchangeRates).map(curr => ({ value: curr, label: curr }))}
                className="bg-light"
              />
            </div>
            {inputCurrency !== 'USD' && (
              <small className="text-muted mt-1 d-block">
                ≈ ${formData.basePricePerNight.toFixed(2)} USD (Rate: {exchangeRates[inputCurrency]})
              </small>
            )}
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Max Capacity</label>
            <input
              type="number"
              className="form-control"
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Size (Optional)</label>
            <input
              type="text"
              className="form-control"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder='e.g. "45 sqm"'
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-12 mb-3">
            <label className="form-label fw-bold">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the room type..."
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold d-block">Amenities</label>
          <div className="d-flex flex-wrap gap-2">
            {commonAmenities.map(amenity => (
              <div 
                key={amenity}
                className={`badge rounded-pill p-2 cursor-pointer ${formData.amenities.includes(amenity) ? 'bg-success' : 'bg-light text-dark border'}`}
                onClick={() => toggleAmenity(amenity)}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {amenity} {formData.amenities.includes(amenity) && <FaCheck className="ms-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <ImageUpload 
            existingImages={formData.imageUrls.filter(url => url && url.trim() !== '')}
            onUploadComplete={(url) => {
              setFormData(prev => ({
                ...prev,
                imageUrls: [...prev.imageUrls.filter(u => u && u.trim() !== ''), url]
              }));
            }}
            onDelete={(url) => {
              setFormData(prev => ({
                ...prev,
                imageUrls: prev.imageUrls.filter(u => u !== url)
              }));
            }}
            maxImages={10}
            title="Room Images"
          />
        </div>
      </EditFormModal>

      <div className="container">
        <div className="mb-4">
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C' }}>Room Types Management</h2>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading Room Types..." />
        ) : (
          <div className="users-table-container">
            <div className="users-table-header">
              <h4 className="m-0">Available Room Types ({roomTypes.length})</h4>
              <button 
                className="btn btn-primary btn-sm d-flex align-items-center gap-2" 
                style={{ background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', border: 'none', padding: '0.5rem 1rem' }}
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <FaPlus /> Add New Room Type
              </button>
            </div>
            <div className="table-responsive">
              <table className="users-table room-types-table-layout">
                <thead>
                  <tr>
                    <th>{t('admin.name') || 'Name'}</th>
                    <th>{t('admin.price') || 'Price'}</th>
                    <th>{t('admin.capacity') || 'Capacity'}</th>
                    <th>{t('admin.amenities') || 'Amenities'}</th>
                    <th>{t('admin.images') || 'Images'}</th>
                    <th>{t('admin.actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        <div className="empty-state-icon">🛏️</div>
                        <p>No room types defined yet.</p>
                      </td>
                    </tr>
                  ) : (
                    roomTypes.map((rt) => (
                      <tr key={rt.id}>
                        <td>
                          <div className="fw-bold">{rt.name}</div>
                          <small className="text-muted">{rt.size}</small>
                        </td>
                        <td style={{ color: '#8B6F47', fontWeight: 600 }}>${rt.basePricePerNight.toFixed(2)}</td>
                        <td>{rt.maxCapacity} Guests</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {rt.amenities && rt.amenities.slice(0, 3).map((a, i) => (
                              <span key={i} className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>{a}</span>
                            ))}
                            {rt.amenities && rt.amenities.length > 3 && (
                              <span className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>+{rt.amenities.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {rt.imageUrls && rt.imageUrls.length > 0 ? (
                            <span className="badge bg-info text-white">{rt.imageUrls.length} Images</span>
                          ) : (
                            <span className="text-muted small">No images</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                              onClick={() => {
                                setSelectedRoomTypeId(rt.id);
                                setShowBatchModal(true);
                              }}
                              title="Batch Create Rooms"
                              style={{ borderColor: '#C9A961', color: '#8B6F47' }}
                            >
                              <FaMagic /> Batch
                            </button>
                            <button
                              className="btn-edit"
                              onClick={() => handleEdit(rt)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(rt.id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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

export default RoomTypesManagement;
