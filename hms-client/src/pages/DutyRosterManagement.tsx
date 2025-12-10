import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dutyRosterApi, DutyRoster } from '../services/api';
import { adminApi, User } from '../services/api';
import { FaCalendarTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LuxurySelect from '../components/common/LuxurySelect';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../components/Auth.css'; // For luxury calendar styles
import './Admin.css'; // Reuse admin styles for table/layout consistency

// Roster Card Component
interface RosterCardProps {
  roster: DutyRoster;
  onEdit: (roster: DutyRoster) => void;
  onDelete: (id: number) => void;
}

const RosterCard: React.FC<RosterCardProps> = ({ roster, onEdit, onDelete }) => {
  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'Morning':
        return { bg: '#FFF4E6', border: '#FFD89B', text: '#8B6F47' };
      case 'Afternoon':
        return { bg: '#E6F3FF', border: '#99CCFF', text: '#4A6FA5' };
      case 'Night':
        return { bg: '#F0E6FF', border: '#CC99FF', text: '#6B4A8B' };
      default:
        return { bg: '#F5F1E8', border: '#C9A961', text: '#8B6F47' };
    }
  };

  const shiftColors = getShiftColor(roster.shift);

  return (
    <motion.div
      className="card shadow-sm border-0 h-100"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 16px rgba(139, 111, 71, 0.15)' }}
      transition={{ duration: 0.2 }}
      style={{
        borderRadius: '12px',
        background: '#FFFFFF',
        border: `2px solid ${shiftColors.border}`,
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${shiftColors.bg} 0%, ${shiftColors.border}20 100%)`,
          padding: '1rem',
          borderBottom: `2px solid ${shiftColors.border}`
        }}
      >
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h6 className="mb-1" style={{ color: shiftColors.text, fontFamily: 'Playfair Display, serif', fontSize: '1rem', fontWeight: 600 }}>
              {roster.staffName}
            </h6>
            <span
              className="badge"
              style={{
                background: shiftColors.border,
                color: shiftColors.text,
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontWeight: 500
              }}
            >
              {roster.shift}
            </span>
          </div>
        </div>
      </div>
      
      <div className="card-body p-3">
        <div className="mb-3">
          <div className="d-flex align-items-center mb-2" style={{ color: '#6B5435' }}>
            <i className="fas fa-clock me-2" style={{ color: '#C9A961', fontSize: '0.9rem' }}></i>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {roster.startTime?.substring(0, 5) || 'N/A'} - {roster.endTime?.substring(0, 5) || 'N/A'}
            </span>
          </div>
          
          {roster.notes && (
            <div className="d-flex align-items-start" style={{ color: '#6B5435' }}>
              <i className="fas fa-sticky-note me-2 mt-1" style={{ color: '#C9A961', fontSize: '0.85rem' }}></i>
              <span style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{roster.notes}</span>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid rgba(201, 169, 97, 0.2)' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(roster);
            }}
            className="btn btn-sm"
            style={{
              background: '#F5F1E8',
              color: '#8B6F47',
              border: '1px solid #C9A961',
              borderRadius: '8px',
              padding: '0.4rem 0.8rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#C9A961';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F5F1E8';
              e.currentTarget.style.color = '#8B6F47';
            }}
            title="Edit"
          >
            <i className="fas fa-pencil-alt"></i>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(roster.id);
            }}
            className="btn btn-sm"
            style={{
              background: '#FFF5F5',
              color: '#D97777',
              border: '1px solid #FFB3B3',
              borderRadius: '8px',
              padding: '0.4rem 0.8rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFB3B3';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFF5F5';
              e.currentTarget.style.color = '#D97777';
            }}
            title="Delete"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const DutyRosterManagement: React.FC = () => {
  const { isManager, isAdmin } = useAuth();
  const { getRoleName } = useLanguage();
  const [rosters, setRosters] = useState<DutyRoster[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Date state as Date objects for DatePicker
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formDate, setFormDate] = useState<Date>(new Date());

  const [formData, setFormData] = useState({
    staffId: '',
    shift: 'Morning',
    startTime: '08:00',
    endTime: '16:00',
    notes: '',
  });

  useEffect(() => {
    if (!isManager && !isAdmin) return;
    loadData();
  }, [isManager, isAdmin, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const [rostersData, staffData] = await Promise.all([
        dutyRosterApi.getByDate(formattedDate).catch((err) => {
          console.error('Failed to load rosters:', err);
          return [];
        }),
        dutyRosterApi.getStaff().catch((err) => {
          console.error('Failed to load staff:', err);
          console.error('Staff error details:', {
            status: err?.response?.status,
            statusText: err?.response?.statusText,
            data: err?.response?.data,
            message: err?.message
          });
          return [];
        }),
      ]);
      setRosters(rostersData);
      // Staff list from API already filtered to Receptionist and Housekeeping
      console.log('Loaded staff:', staffData);
      setStaff(staffData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        staffId: formData.staffId,
        shift: formData.shift,
        notes: formData.notes || '',
        dateString: format(formDate, 'yyyy-MM-dd'), // Use dateString helper property
        startTimeString: formData.startTime ? `${formData.startTime}:00` : undefined,
        endTimeString: formData.endTime ? `${formData.endTime}:00` : undefined,
      };
      
      if (editingId) {
        await dutyRosterApi.update(editingId, data);
      } else {
        await dutyRosterApi.create(data);
      }
      resetForm();
      loadData();
      setShowForm(false);
    } catch (err: any) {
      console.error('Failed to save roster:', err);
      alert(err.response?.data?.message || 'Failed to save roster');
    }
  };

  const handleEdit = (roster: DutyRoster) => {
    setEditingId(roster.id);
    setFormDate(new Date(roster.date));
    setFormData({
      staffId: roster.staffId,
      shift: roster.shift,
      startTime: roster.startTime ? roster.startTime.substring(0, 5) : '08:00',
      endTime: roster.endTime ? roster.endTime.substring(0, 5) : '16:00',
      notes: roster.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this roster entry?')) return;
    try {
      await dutyRosterApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete roster');
    }
  };

  const resetForm = () => {
    setFormData({
      staffId: '',
      shift: 'Morning',
      startTime: '08:00',
      endTime: '16:00',
      notes: '',
    });
    setFormDate(new Date());
    setEditingId(null);
  };

  if (!isManager && !isAdmin) {
    return <div className="container mt-5"><div className="alert alert-danger">Access denied</div></div>;
  }

  return (
    <div className="dashboard-page" style={{ paddingTop: '2rem', minHeight: '100vh' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C', margin: 0 }}>Duty Roster Management</h4>
          <div className="d-flex align-items-center gap-3">
            <div className="position-relative" style={{ minWidth: '200px' }}>
               <div className="date-input-wrapper">
                 <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date) => setSelectedDate(date)}
                  dateFormat="MMMM d, yyyy"
                  className="auth-input-split"
                  wrapperClassName="w-100"
                  calendarClassName="auth-date-picker-calendar"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="input-icon" style={{ right: '1rem', left: 'auto', pointerEvents: 'none', color: '#C9A961' }}>
                  <i className="fas fa-calendar-alt"></i>
                </span>
               </div>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', border: 'none', borderRadius: '10px', padding: '0.6rem 1.5rem', fontWeight: 600 }}
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              {t('admin.addEntry') || 'Add New Entry'}
            </button>
          </div>
        </div>

        {showForm && (
          <motion.div
            className="card shadow-lg border-0 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ borderRadius: '16px', overflow: 'visible', border: '1px solid rgba(201, 169, 97, 0.2)', zIndex: 10 }}
          >
            <div className="card-header bg-white border-bottom p-4">
              <h5 className="mb-0" style={{ color: '#8B6F47', fontFamily: 'Playfair Display, serif' }}>
                {editingId ? 'Edit Roster Entry' : 'Create New Roster Entry'}
              </h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Staff Member</label>
                    <LuxurySelect
                      value={formData.staffId}
                      onChange={(value) => setFormData({ ...formData, staffId: value })}
                      options={[
                        { value: '', label: 'Select Staff...' },
                        ...staff.map((s) => ({
                          value: s.id,
                          label: `${s.firstName || ''} ${s.lastName || ''}${s.roles && s.roles.length > 0 ? ` (${s.roles.map(r => getRoleName(r)).join(', ')})` : s.role ? ` (${getRoleName(s.role)})` : ''}`
                        }))
                      ]}
                      placeholder="Select Staff..."
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Date</label>
                    <div className="date-input-wrapper">
                      <DatePicker
                        selected={formDate}
                        onChange={(date: Date) => setFormDate(date)}
                        dateFormat="MMMM d, yyyy"
                        className="auth-input-split"
                        wrapperClassName="w-100"
                        calendarClassName="auth-date-picker-calendar"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="scroll"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">Shift</label>
                    <LuxurySelect
                      value={formData.shift}
                      onChange={(value) => setFormData({ ...formData, shift: value })}
                      options={[
                        { value: 'Morning', label: 'Morning (8AM - 4PM)' },
                        { value: 'Afternoon', label: 'Afternoon (4PM - 12AM)' },
                        { value: 'Night', label: 'Night (12AM - 8AM)' },
                      ]}
                      placeholder="Select Shift"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">Start Time</label>
                    <input
                      type="time"
                      className="form-control p-2"
                      style={{ height: '45px', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">End Time</label>
                    <input
                      type="time"
                      className="form-control p-2"
                      style={{ height: '45px', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small text-muted text-uppercase fw-bold">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      style={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-light" 
                    onClick={() => { setShowForm(false); resetForm(); }}
                    style={{ borderRadius: '8px', padding: '0.5rem 1.5rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', border: 'none', borderRadius: '8px', padding: '0.5rem 1.5rem' }}
                  >
                    {editingId ? 'Update Entry' : 'Create Entry'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {loading ? (
          <LoadingSpinner text="Loading Roster..." />
        ) : (
          <div>
            {/* Header Card */}
            <motion.div
              className="card shadow-sm border-0 mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #8B6F47 0%, #6B5435 100%)',
                border: 'none',
                overflow: 'hidden'
              }}
            >
              <div className="card-body p-4">
                <h5 className="m-0" style={{ color: '#C9A961', fontFamily: 'Playfair Display, serif', fontSize: '1.5rem' }}>
                  <i className="fas fa-calendar-alt me-2" style={{ opacity: 0.8 }}></i>
                  Roster for {format(selectedDate, 'MMMM d, yyyy')}
                </h5>
              </div>
            </motion.div>

            {rosters.length > 0 ? (
              <div className="row g-4">
                {/* Morning Shift */}
                {rosters.filter(r => r.shift === 'Morning').length > 0 && (
                  <div className="col-12">
                    <div className="mb-3">
                      <h6 style={{ color: '#8B6F47', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: '1rem' }}>
                        <i className="fas fa-sun me-2" style={{ color: '#C9A961' }}></i>
                        Morning Shift
                      </h6>
                    </div>
                    <div className="row g-3">
                      {rosters
                        .filter(r => r.shift === 'Morning')
                        .map((r) => (
                          <div key={r.id} className="col-md-6 col-lg-4">
                            <RosterCard roster={r} onEdit={handleEdit} onDelete={handleDelete} />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Afternoon Shift */}
                {rosters.filter(r => r.shift === 'Afternoon').length > 0 && (
                  <div className="col-12">
                    <div className="mb-3 mt-4">
                      <h6 style={{ color: '#8B6F47', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: '1rem' }}>
                        <i className="fas fa-cloud-sun me-2" style={{ color: '#C9A961' }}></i>
                        Afternoon Shift
                      </h6>
                    </div>
                    <div className="row g-3">
                      {rosters
                        .filter(r => r.shift === 'Afternoon')
                        .map((r) => (
                          <div key={r.id} className="col-md-6 col-lg-4">
                            <RosterCard roster={r} onEdit={handleEdit} onDelete={handleDelete} />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Night Shift */}
                {rosters.filter(r => r.shift === 'Night').length > 0 && (
                  <div className="col-12">
                    <div className="mb-3 mt-4">
                      <h6 style={{ color: '#8B6F47', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: '1rem' }}>
                        <i className="fas fa-moon me-2" style={{ color: '#C9A961' }}></i>
                        Night Shift
                      </h6>
                    </div>
                    <div className="row g-3">
                      {rosters
                        .filter(r => r.shift === 'Night')
                        .map((r) => (
                          <div key={r.id} className="col-md-6 col-lg-4">
                            <RosterCard roster={r} onEdit={handleEdit} onDelete={handleDelete} />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <motion.div
                className="card shadow-sm border-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  borderRadius: '16px',
                  background: '#F5F1E8',
                  border: '1px solid rgba(201, 169, 97, 0.2)',
                  minHeight: '300px'
                }}
              >
                <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                  <div className="mb-3" style={{ fontSize: '4rem', opacity: 0.3, color: '#8B6F47' }}>
                    <FaCalendarTimes />
                  </div>
                  <h5 style={{ color: '#8B6F47', fontFamily: 'Playfair Display, serif', marginBottom: '0.5rem' }}>
                    No roster entries
                  </h5>
                  <p className="text-muted mb-0" style={{ color: '#6B5435' }}>
                    No roster entries for this date
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper for t function placeholder since useLanguage hook wasn't imported in my mock
const t = (key: string) => key === 'admin.addEntry' ? 'Add New Entry' : key;

export default DutyRosterManagement;