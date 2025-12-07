import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dutyRosterApi, DutyRoster } from '../services/api';
import { adminApi, User } from '../services/api';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import './Dashboard.css';

const DutyRosterManagement: React.FC = () => {
  const { isManager, isAdmin } = useAuth();
  const [rosters, setRosters] = useState<DutyRoster[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formData, setFormData] = useState({
    staffId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
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
    try {
      const [rostersData, staffData] = await Promise.all([
        dutyRosterApi.getByDate(selectedDate).catch(() => []),
        adminApi.getUsers().catch(() => []),
      ]);
      setRosters(rostersData);
      // Filter staff (Receptionist, Housekeeping)
      setStaff(staffData.filter((u: User) => 
        u.role === 'Receptionist' || u.role === 'Housekeeping'
      ));
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        startTime: formData.startTime ? `${formData.startTime}:00` : undefined,
        endTime: formData.endTime ? `${formData.endTime}:00` : undefined,
      };
      if (editingId) {
        await dutyRosterApi.update(editingId, data);
      } else {
        await dutyRosterApi.create(data);
      }
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save roster');
    }
  };

  const handleEdit = (roster: DutyRoster) => {
    setEditingId(roster.id);
    setFormData({
      staffId: roster.staffId,
      date: format(new Date(roster.date), 'yyyy-MM-dd'),
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
      date: format(new Date(), 'yyyy-MM-dd'),
      shift: 'Morning',
      startTime: '08:00',
      endTime: '16:00',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (!isManager && !isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Duty Roster Management</h2>
          <div className="d-flex align-items-center gap-3">
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: 'auto' }}
            />
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Add New Entry'}
            </button>
          </div>
        </div>

        {showForm && (
          <motion.div
            className="card shadow-sm mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card-body">
              <h5 className="card-title">{editingId ? 'Edit' : 'Create'} Duty Roster</h5>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Staff</label>
                    <select
                      className="form-select"
                      value={formData.staffId}
                      onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                      required
                    >
                      <option value="">Select staff...</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {`${s.firstName} ${s.lastName}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Shift</label>
                    <select
                      className="form-select"
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      required
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-success me-2">
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Roster for {format(new Date(selectedDate), 'MMMM dd, yyyy')}</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Staff</th>
                      <th>Shift</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosters.length > 0 ? (
                      rosters.map((r) => (
                        <tr key={r.id}>
                          <td>{r.staffName}</td>
                          <td>{r.shift}</td>
                          <td>{r.startTime || '-'}</td>
                          <td>{r.endTime || '-'}</td>
                          <td>{r.notes || '-'}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleEdit(r)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(r.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          No roster entries for this date
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DutyRosterManagement;

