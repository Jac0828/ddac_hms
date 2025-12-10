import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { adminApi, User } from '../services/api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../components/RoomsList.css';
import LuxurySelect from '../components/common/LuxurySelect'; // Import LuxurySelect

interface RoleInfo {
  name: string;
  description: string;
  icon: string;
  color: string;
  userCount: number;
  permissions: string[];
}

const Roles: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t, getRoleName } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleAssignModal, setShowRoleAssignModal] = useState(false);
  const [newRole, setNewRole] = useState('Customer');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      setError(t('roles.loadError') || 'Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const roles: RoleInfo[] = [
    {
      name: 'Admin',
      description: t('roles.adminDescription') || 'Full system access and management capabilities',
      icon: '👑',
      color: '#C9A961',
      userCount: users.filter(u => u.roles.includes('Admin')).length,
      permissions: [
        t('roles.permissionAllAccess') || 'Full system access',
        t('roles.permissionUserManagement') || 'User management',
        t('roles.permissionSystemSettings') || 'System settings',
        t('roles.permissionReports') || 'Reports and analytics',
      ],
    },
    {
      name: 'Manager',
      description: t('roles.managerDescription') || 'Hotel operations and staff management',
      icon: '📊',
      color: '#B8944F',
      userCount: users.filter(u => u.roles.includes('Manager')).length,
      permissions: [
        t('roles.permissionOperations') || 'Operations management',
        t('roles.permissionStaffManagement') || 'Staff management',
        t('roles.permissionReports') || 'Reports and analytics',
        t('roles.permissionRooms') || 'Room management',
      ],
    },
    {
      name: 'Receptionist',
      description: t('roles.receptionistDescription') || 'Guest check-in/out and booking management',
      icon: '🏨',
      color: '#8B6F47',
      userCount: users.filter(u => u.roles.includes('Receptionist')).length,
      permissions: [
        t('roles.permissionBookings') || 'Booking management',
        t('roles.permissionCheckIn') || 'Check-in/Check-out',
        t('roles.permissionRooms') || 'Room management',
        t('roles.permissionGuests') || 'Guest services',
      ],
    },
    {
      name: 'Housekeeping',
      description: t('roles.housekeepingDescription') || 'Room cleaning and maintenance tasks',
      icon: '🧹',
      color: '#A0826D',
      userCount: users.filter(u => u.roles.includes('Housekeeping')).length,
      permissions: [
        t('roles.permissionCleaning') || 'Room cleaning',
        t('roles.permissionMaintenance') || 'Maintenance tasks',
        t('roles.permissionServiceRequests') || 'Service requests',
      ],
    },
    {
      name: 'Customer',
      description: t('roles.customerDescription') || 'Guest access to bookings and services',
      icon: '👤',
      color: '#718096',
      userCount: users.filter(u => u.roles.includes('Customer')).length,
      permissions: [
        t('roles.permissionBookRooms') || 'Book rooms',
        t('roles.permissionViewBookings') || 'View bookings',
        t('roles.permissionServiceRequests') || 'Service requests',
      ],
    },
  ];

  const handleAssignRole = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      setSuccess(null);

      await adminApi.updateUser(selectedUser.id, {
        fullName: selectedUser.fullName,
        phoneNumber: selectedUser.phoneNumber || '',
        role: newRole,
        isActive: selectedUser.isActive,
      });

      setSuccess(t('roles.roleAssigned') || `Role ${newRole} assigned successfully`);
      setShowRoleAssignModal(false);
      setSelectedUser(null);
      await loadUsers();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('roles.assignError') || 'Failed to assign role');
      console.error(err);
    }
  };

  const getUsersByRole = (roleName: string): User[] => {
    return users.filter(user => user.roles.includes(roleName));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return <LoadingSpinner text={t('roles.loading') || 'Loading roles...'} />;
  }

  return (
    <div className="rooms-container-luxury">
      <div className="rooms-content-luxury">
        {/* Header */}
        <motion.div
          className="rooms-header-luxury"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="rooms-title-luxury">{t('roles.title') || 'Role Management'}</h1>
          <p className="rooms-subtitle-luxury">{t('roles.subtitle') || 'Manage user roles and permissions'}</p>
        </motion.div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            className="availability-error-luxury"
            style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#059669' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {success}
          </motion.div>
        )}

        {error && (
          <motion.div
            className="availability-error-luxury"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Roles Grid */}
        <motion.div
          className="rooms-grid-luxury"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', marginBottom: '2rem' }}
        >
          {roles.map((role) => (
            <motion.div
              key={role.name}
              className="room-card-luxury"
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => setSelectedRole(selectedRole === role.name ? null : role.name)}
              style={{ cursor: 'pointer' }}
            >
              <div className="room-card-content-luxury">
                <div className="room-header-luxury" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>{role.icon}</span>
                    <h3 className="room-type-luxury" style={{ margin: 0 }}>{getRoleName(role.name)}</h3>
                  </div>
                  <div className="room-number-luxury" style={{ fontSize: '1.1rem', fontWeight: 700, color: role.color }}>
                    {role.userCount} {role.userCount === 1 ? (t('roles.user') || 'user') : (t('roles.users') || 'users')}
                  </div>
                </div>

                <p className="room-description-luxury" style={{ marginBottom: '1.5rem' }}>
                  {role.description}
                </p>

                <div className="room-amenities-luxury" style={{ flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, color: '#8B6F47', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    {t('roles.permissions') || 'Permissions:'}
                  </div>
                  {role.permissions.map((permission, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#4a5568' }}>
                      <span style={{ color: role.color }}>✓</span>
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Users by Role */}
        {selectedRole && (
          <motion.div
            className="room-availability-card-luxury"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title-luxury" style={{ margin: 0 }}>
                {t('roles.usersWithRole') || 'Users with'} {getRoleName(selectedRole || '')} {t('roles.role') || 'Role'}
              </h2>
              <button
                onClick={() => setSelectedRole(null)}
                className="room-button-secondary-luxury"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                {t('roles.close') || 'Close'}
              </button>
            </div>

            {getUsersByRole(selectedRole).length === 0 ? (
              <div className="empty-state-luxury" style={{ padding: '2rem' }}>
                <div className="empty-icon-luxury">👤</div>
                <p>{t('roles.noUsers') || 'No users with this role'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {getUsersByRole(selectedRole).map((user) => (
                  <div
                    key={user.id}
                    className="rate-plan-card-luxury"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#8B6F47', marginBottom: '0.25rem' }}>
                        {user.fullName}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                        {user.email}
                      </div>
                      {user.phoneNumber && (
                        <div style={{ fontSize: '0.85rem', color: '#A0AEC0', marginTop: '0.25rem' }}>
                          {user.phoneNumber}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`room-status-badge-luxury status-${user.isActive ? 'available' : 'occupied'}`} style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
                        {user.isActive ? (t('roles.active') || 'Active') : (t('roles.inactive') || 'Inactive')}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.roles[0] || 'Customer');
                          setShowRoleAssignModal(true);
                        }}
                        className="room-button-secondary-luxury"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        {t('roles.changeRole') || 'Change Role'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Role Assign Modal */}
        {showRoleAssignModal && selectedUser && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
            onClick={() => setShowRoleAssignModal(false)}
          >
            <motion.div
              className="booking-card-luxury"
              style={{ maxWidth: '500px', width: '90%', margin: '1rem' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="booking-title-luxury" style={{ marginBottom: '1rem' }}>
                {t('roles.assignRole') || 'Assign Role'}
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.5rem', color: '#718096', fontSize: '0.9rem' }}>
                  {t('roles.user') || 'User'}: <strong>{selectedUser.fullName}</strong>
                </div>
                <div style={{ marginBottom: '0.5rem', color: '#718096', fontSize: '0.9rem' }}>
                  {t('roles.currentRole') || 'Current Role'}: <strong>{getRoleName(selectedUser.roles[0] || 'Customer')}</strong>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="search-label-luxury" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  {t('roles.selectRole') || 'Select New Role'}
                </label>
                <LuxurySelect
                  className="filter-select-luxury"
                  value={newRole}
                  onChange={setNewRole}
                  options={roles.map((role) => ({
                    value: role.name,
                    label: getRoleName(role.name)
                  }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowRoleAssignModal(false)}
                  className="room-button-secondary-luxury"
                  style={{ flex: 1 }}
                >
                  {t('roles.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleAssignRole}
                  className="room-button-primary-luxury"
                  style={{ flex: 1 }}
                >
                  {t('roles.assign') || 'Assign Role'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;

