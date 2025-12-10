import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usersApi, User, adminApi } from '../services/api';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LuxurySelect from '../components/common/LuxurySelect';
import FeedbackModal, { FeedbackModalProps } from '../components/common/FeedbackModal';
import EditFormModal from '../components/common/EditFormModal';
import { FaUserTie, FaConciergeBell, FaBroom, FaSearch, FaPencilAlt, FaTrash, FaPlus } from 'react-icons/fa';
import './StaffList.css';

const StaffList: React.FC = () => {
  const { isManager, isAdmin } = useAuth();
  const { t, getRoleName } = useLanguage();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal States
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalProps>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
  });

  // Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'admin123', // Default password
    phoneNumber: '',
    role: 'Receptionist',
    isActive: true
  });

  useEffect(() => {
    if (isManager || isAdmin) {
      loadStaff();
    }
  }, [isManager, isAdmin]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      // Pass role filter to backend if specific role is selected, or nothing to get all
      // Note: usersApi.getAll currently fetches all, but we can optimize it later to accept params
      // For now, rely on the backend optimization we just implemented
      const allUsers = await usersApi.getAll();
      
      // Still filter locally for search query and to ensure we only show staff roles
      // (Backend now efficiently fetches roles, so this part is fast)
      const staffMembers = allUsers.filter(u => 
        ['Manager', 'Receptionist', 'Housekeeping'].includes(u.role || '') || 
        (u.roles && u.roles.some(r => ['Manager', 'Receptionist', 'Housekeeping'].includes(r)))
      );
      
      const mappedStaff = staffMembers.map(u => ({
        ...u,
        role: u.role || (u.roles && u.roles.length > 0 ? u.roles[0] : 'Unknown')
      }));

      setStaff(mappedStaff);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        // Use usersApi instead of adminApi for Manager permissions
        await usersApi.update(editingStaff.id, {
          fullName: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          isActive: formData.isActive
        });
        setFeedbackModal({
          isOpen: true, type: 'success', title: 'Success', message: 'Staff updated successfully',
          onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
        });
      } else {
        // Use usersApi instead of adminApi for Manager permissions
        // Password is initialized to "admin123" by default
        
        await usersApi.create({
          fullName: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          role: formData.role
        });
        setFeedbackModal({
          isOpen: true, type: 'success', title: 'Success', message: 'Staff created successfully',
          onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
        });
      }
      setShowForm(false);
      setEditingStaff(null);
      resetForm();
      loadStaff();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save staff';
      const errorDetails = err.response?.data?.errors 
        ? (Array.isArray(err.response.data.errors) ? err.response.data.errors.map((e: any) => e.description || e).join(', ') : JSON.stringify(err.response.data.errors))
        : '';
      
      setFeedbackModal({
        isOpen: true, 
        type: 'error', 
        title: 'Error', 
        message: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
        onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleDeleteStaff = async (id: string) => {
    setFeedbackModal({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Staff',
      message: 'Are you sure you want to delete this staff member?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        try {
          // Use usersApi instead of adminApi for Manager permissions
          await usersApi.delete(id);
          setFeedbackModal({
            isOpen: true, type: 'success', title: 'Success', message: 'Staff deleted successfully',
            onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
          });
          loadStaff();
        } catch (err: any) {
          setFeedbackModal({
            isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete staff',
            onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
          });
        }
      }
    });
  };

  const openEditStaff = (staffMember: User) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName || '',
      lastName: staffMember.lastName || '',
      email: staffMember.email || '',
      password: '',
      phoneNumber: staffMember.phoneNumber || '',
      role: staffMember.role || 'Receptionist',
      isActive: staffMember.isActive !== undefined ? staffMember.isActive : true
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: 'admin123', // Default password
      phoneNumber: '',
      role: 'Receptionist',
      isActive: true
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Manager': return <FaUserTie />;
      case 'Receptionist': return <FaConciergeBell />;
      case 'Housekeeping': return <FaBroom />;
      default: return <FaUserTie />;
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = 
      (s.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (s.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (!isManager && !isAdmin) {
    return <div className="container mt-5"><div className="alert alert-danger">Access denied</div></div>;
  }

  return (
    <div className="staff-list-page">
      <div className="container">
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          type={feedbackModal.type}
          title={feedbackModal.title}
          message={feedbackModal.message}
          onClose={feedbackModal.onClose}
          onConfirm={feedbackModal.onConfirm}
          confirmText={feedbackModal.confirmText}
          cancelText={feedbackModal.cancelText}
        />

        <EditFormModal
          isOpen={showForm}
          onClose={() => { setShowForm(false); resetForm(); setEditingStaff(null); }}
          title={editingStaff ? 'Edit Staff' : 'Create Staff'}
          onSubmit={handleCreateStaff}
          submitText={editingStaff ? 'Update Staff' : 'Create Staff'}
        >
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">First Name</label>
              <input type="text" className="form-control" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-control" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>
          {!editingStaff && (
            <div className="mb-3" style={{ display: 'none' }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder="Default: admin123"
              />
              <small className="text-muted">Default password will be set to "admin123"</small>
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Phone Number</label>
            <input type="text" className="form-control" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Role</label>
              <LuxurySelect 
                value={formData.role}
                onChange={(val) => setFormData({...formData, role: val})}
                options={[
                  { value: 'Manager', label: getRoleName('Manager') },
                  { value: 'Receptionist', label: getRoleName('Receptionist') },
                  { value: 'Housekeeping', label: getRoleName('Housekeeping') }
                ]}
              />
            </div>
            {editingStaff && (
              <div className="col-md-6 mb-3">
                <label className="form-label">Status</label>
                <div className="form-check form-switch mt-2">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={formData.isActive} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                  />
                  <label className="form-check-label">{formData.isActive ? 'Active' : 'Inactive'}</label>
                </div>
              </div>
            )}
          </div>
        </EditFormModal>

        {/* Header & Filters */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <button 
              className="btn btn-primary d-flex align-items-center gap-2" 
              style={{ background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', border: 'none', borderRadius: '10px', padding: '0.6rem 1.5rem', fontWeight: 600 }}
              onClick={() => { setShowForm(true); setEditingStaff(null); resetForm(); }}
            >
              <FaPlus /> Add New Staff
            </button>
          </div>
          
          <div className="d-flex gap-3 flex-wrap">
             <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    borderRadius: '30px', 
                    border: '1px solid rgba(201, 169, 97, 0.3)',
                    padding: '0.6rem 1.5rem',
                    minWidth: '250px'
                  }}
                />
             </div>
             <div style={{ minWidth: '200px' }}>
               <LuxurySelect 
                 options={[
                   { value: 'all', label: t('roles.role') ? `${t('roles.role')}s` : 'All Roles' },
                   { value: 'Manager', label: getRoleName('Manager') },
                   { value: 'Receptionist', label: getRoleName('Receptionist') },
                   { value: 'Housekeeping', label: getRoleName('Housekeeping') },
                 ]}
                 value={roleFilter}
                 onChange={setRoleFilter}
                 placeholder="Filter by Role"
               />
             </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading Staff List..." />
        ) : (
          <motion.div 
            className="staff-table-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="staff-table-header">
              <h2 className="staff-table-title">Staff Members</h2>
              <span className="badge bg-light text-dark border">{filteredStaff.length} Staff Found</span>
            </div>
            
            <div className="table-responsive">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Role</th>
                    <th>Contact Info</th>
                    <th>Status</th>
                    <th>Date Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar-circle me-3" style={{
                              width: '40px', height: '40px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)',
                              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 'bold', overflow: 'hidden'
                            }}>
                              {member.profilePictureUrl ? (
                                <img src={member.profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <>{(member.firstName?.charAt(0) || '')}{(member.lastName?.charAt(0) || '')}</>
                              )}
                            </div>
                            <div>
                              <div className="fw-bold" style={{ color: '#2C2C2C' }}>
                                {(member.firstName || member.lastName) ? `${member.firstName || ''} ${member.lastName || ''}` : member.userName}
                              </div>
                              {(!member.firstName && !member.lastName && !member.userName) && <div className="text-muted fst-italic">No Name</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`staff-badge ${member.role?.toLowerCase()}`}>
                            {getRoleIcon(member.role || '')}
                            {getRoleName(member.role || '')}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column small">
                            <span>{member.email}</span>
                            <span className="text-muted">{member.phoneNumber || '-'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`staff-status-badge ${member.isActive ? 'active' : 'inactive'}`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-sm btn-outline-primary border-0" onClick={() => openEditStaff(member)} style={{ color: '#C9A961' }}>
                              <FaPencilAlt />
                            </button>
                            <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDeleteStaff(member.id)}>
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        No staff members found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StaffList;

