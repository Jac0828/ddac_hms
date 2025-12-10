import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaCrown, FaUser, FaIdCard, FaLock, FaCheckCircle, FaPencilAlt, FaGift, FaEnvelope, FaEnvelopeOpen, FaCamera } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { authApi } from '../services/api';
import FeedbackModal from '../components/common/FeedbackModal';
import EditFormModal from '../components/common/EditFormModal';
import ImageUpload from '../components/common/ImageUpload';
import './Profile.css';

const Profile: React.FC = () => {
  const { user, isAuthenticated, isLoading, updateUser, isCustomer } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', profilePictureUrl: '' });
  
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  useEffect(() => {
    // Wait for auth state to be restored from localStorage
    if (isLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user) {
      setProfileData({ 
        firstName: user.firstName || '', 
        lastName: user.lastName || '', 
        email: user.email || '', 
        phoneNumber: user.phoneNumber || '',
        profilePictureUrl: user.profilePictureUrl || ''
      });
      
      // Check if user needs to verify email (from registration redirect)
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('verifyEmail') === 'true' && !user.emailConfirmed) {
        setShowVerificationInput(true);
      }
    }
  }, [isLoading, isAuthenticated, navigate, user]);

  if (!user) return null;

  const getTierClass = (tier: string | undefined) => {
    if (!user.emailConfirmed) return 'unverified';
    const t = (tier || 'Member').toLowerCase();
    if (t.includes('platinum')) return 'platinum';
    if (t.includes('gold')) return 'gold';
    if (t.includes('silver')) return 'silver';
    return 'member';
  };

  const getNextTierInfo = (points: number | undefined) => {
    const currentPoints = points || 0;
    if (currentPoints < 1000) return { next: 'Silver', needed: 1000 - currentPoints, total: 1000 };
    if (currentPoints < 5000) return { next: 'Gold', needed: 5000 - currentPoints, total: 5000 };
    if (currentPoints < 10000) return { next: 'Platinum', needed: 10000 - currentPoints, total: 10000 };
    return { next: 'Maximum Tier', needed: 0, total: 10000 };
  };

  const tierInfo = getNextTierInfo(user.points);
  const progressPercent = Math.min(100, Math.max(0, ((user.points || 0) / tierInfo.total) * 100));


  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setFeedbackModal({ isOpen: true, type: 'error', title: 'Error', message: 'New passwords do not match' });
      return;
    }
    try {
      await authApi.changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      setIsChangePasswordOpen(false);
      setFeedbackModal({ isOpen: true, type: 'success', title: 'Success', message: 'Password changed successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error: any) {
      setFeedbackModal({ isOpen: true, type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to change password' });
    }
  };

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent page refresh
    try {
      console.log('[Profile] Updating profile with data:', profileData);
      const response = await authApi.updateProfile(profileData);
      console.log('[Profile] Update response:', response);
      
      if (user) {
          const updatedUser = {
              ...user,
              id: response.user.id || user.id,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              email: response.user.email,
              phoneNumber: response.user.phoneNumber || '',
              emailConfirmed: response.user.emailConfirmed,
              profilePictureUrl: response.user.profilePictureUrl,
          };
          updateUser(updatedUser, response.token);
          
          // Update local profileData to reflect changes
          setProfileData({
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber || '',
            profilePictureUrl: updatedUser.profilePictureUrl || ''
          });
      }

      // Close edit modal first, then show feedback after a short delay
      setIsEditProfileOpen(false);
      
      // Use setTimeout to ensure EditFormModal is fully closed before showing FeedbackModal
      setTimeout(() => {
        setFeedbackModal({ 
          isOpen: true, 
          type: 'success', 
          title: t('profile.success') || 'Success', 
          message: t('profile.updateSuccess') || 'Profile updated successfully' 
        });
      }, 300);
    } catch (error: any) {
      console.error('[Profile] Update error:', error);
      console.error('[Profile] Error response:', error.response?.data);
      
      // Close edit modal first
      setIsEditProfileOpen(false);
      
      // Show error feedback after modal closes
      setTimeout(() => {
        setFeedbackModal({ 
          isOpen: true, 
          type: 'error', 
          title: t('profile.error') || 'Error', 
          message: error.response?.data?.message || t('profile.updateError') || 'Failed to update profile' 
        });
      }, 300);
    }
  };

  const handleSendVerificationEmail = async () => {
    try {
      setIsVerifyingEmail(true);
      const response = await authApi.sendVerificationEmail();
      
      // In development, show the code; in production, this would be sent via email
      if (response.verificationCode) {
        setFeedbackModal({ 
          isOpen: true, 
          type: 'success', 
          title: 'Verification Code Sent', 
          message: `Development mode: Your verification code is ${response.verificationCode}. In production, this will be sent to your email.` 
        });
        setShowVerificationInput(true);
      } else {
        setFeedbackModal({ 
          isOpen: true, 
          type: 'success', 
          title: 'Verification Code Sent', 
          message: 'Please check your email for the 6-digit verification code.' 
        });
        setShowVerificationInput(true);
      }
    } catch (error: any) {
      setFeedbackModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to send verification code' 
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setFeedbackModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Please enter a valid 6-digit verification code' 
      });
      return;
    }

    try {
      setIsVerifyingEmail(true);
      // Get userId from user object
      const userId = user.id;
      if (!userId) {
        setFeedbackModal({ 
          isOpen: true, 
          type: 'error', 
          title: 'Error', 
          message: 'User ID not found' 
        });
        return;
      }
      
      const response = await authApi.verifyEmail({ 
        userId: userId, 
        code: verificationCode 
      });
      
      // Update user with new token and emailConfirmed status
      if (user) {
        const updatedUser = {
          ...user,
          id: response.id || user.id,
          emailConfirmed: true,
          membershipTier: response.membershipTier || user.membershipTier,
        };
        updateUser(updatedUser, response.token);
      }

      setShowVerificationInput(false);
      setVerificationCode('');
      setFeedbackModal({ 
        isOpen: true, 
        type: 'success', 
        title: 'Email Verified', 
        message: 'Your email has been verified successfully! You can now enjoy member benefits.' 
      });
      
      // Remove verifyEmail from URL
      window.history.replaceState({}, '', '/profile');
    } catch (error: any) {
      setFeedbackModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to verify email. Please check your code and try again.' 
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  return (
    <div className="profile-container-luxury">
      <div className={`profile-grid-layout ${!isCustomer ? 'single-column' : ''}`}>
        {/* Left Column: Membership Card - Only for Customers */}
        {isCustomer && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className={`membership-card-luxury ${getTierClass(user.membershipTier)}`}>
            <div className="card-pattern"></div>
            <div className="card-header-section">
              <div className="hotel-brand">SHANGRI-LA</div>
              <div className="tier-badge">
                <FaCrown /> {user.emailConfirmed ? (user.membershipTier || 'Member') : 'Unverified'}
              </div>
            </div>
            <div className="card-user-info">
              <div className="user-name-large">{user.firstName} {user.lastName}</div>
              <div className="member-since">{user.emailConfirmed ? `${t('profile.memberSince') || 'Member since'} ${new Date(user.createdAt || Date.now()).getFullYear()}` : 'Join Date: ' + new Date(user.createdAt || Date.now()).getFullYear()}</div>
            </div>
            <div className="card-footer-section">
              <div className="points-display">
                <span className="points-label">{t('profile.points') || 'Points'}</span>
                <div className="points-value">{user.points || 0}</div>
                {tierInfo.needed > 0 && <div className="points-next-tier">{tierInfo.needed} {t('profile.toNextTier') || 'to'} {tierInfo.next}</div>}
              </div>
            </div>
            {tierInfo.needed > 0 && (
              <div className="tier-progress-container">
                <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div></div>
              </div>
            )}
          </div>
          <div className="text-center">
            <Link to="/membership-benefits" className="btn-gold w-100 mb-3 d-inline-block text-center text-decoration-none">
              <FaGift className="me-2" /> {t('profile.viewBenefits') || 'View Tier Benefits'}
            </Link>
          </div>
        </motion.div>
        )}

        {/* Right Column: Details */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          {/* Personal Details */}
          <div className="detail-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0"><FaUser /> {t('profile.personalDetails') || 'Personal Details'}</h3>
              <button className="btn-outline-gold btn-sm" onClick={() => setIsEditProfileOpen(true)}>
                <FaPencilAlt className="me-2" /> {t('profile.edit') || 'Edit'}
              </button>
            </div>
            
            <div className="d-flex justify-content-center mb-4 position-relative">
              <div className="position-relative">
                <div className="avatar-circle-large" style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '2.5rem', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  {user.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</span>
                  )}
                </div>
                <button 
                  className="position-absolute bottom-0 end-0 btn btn-sm btn-light rounded-circle shadow-sm border"
                  style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setIsEditProfileOpen(true)}
                  title="Change Profile Picture"
                >
                  <FaCamera style={{ color: '#8B6F47', fontSize: '0.9rem' }} />
                </button>
              </div>
            </div>

            <div className="info-row">
              <span className="info-label">{t('profile.firstName') || 'First Name'}</span>
              <span className="info-value">{user.firstName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('profile.lastName') || 'Last Name'}</span>
              <span className="info-value">{user.lastName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('profile.email') || 'Email'}</span>
              <div className="d-flex align-items-center">
                <span className="info-value">{user.email}</span>
                {user.emailConfirmed ? (
                  <span className="badge bg-success text-white ms-2">
                    <FaEnvelopeOpen className="me-1" /> {t('profile.verified') || 'Verified'}
                  </span>
                ) : (
                  <span className="badge bg-warning text-dark ms-2">
                    <FaEnvelope className="me-1" /> {t('profile.unverified') || 'Unverified'}
                  </span>
                )}
              </div>
            </div>
            {!user.emailConfirmed && (
              <div className="info-row">
                <div className="alert alert-warning mb-0" style={{ 
                  fontSize: '0.875rem', 
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(255, 243, 224, 0.8) 0%, rgba(255, 248, 240, 0.8) 100%)',
                  border: '2px solid rgba(201, 169, 97, 0.3)'
                }}>
                  <div className="d-flex align-items-start mb-2">
                    <FaEnvelope className="me-2 mt-1" style={{ color: '#C9A961', fontSize: '1.1rem' }} />
                    <div className="flex-grow-1">
                      <strong style={{ color: '#8B6F47' }}>{t('profile.emailNotVerified') || 'Email not verified.'}</strong>
                      <p className="mb-2 mt-1" style={{ color: '#6C757D', fontSize: '0.85rem', lineHeight: '1.5' }}>
                        {t('profile.verifyEmailDesc') || 'Verify your email to become a member and unlock exclusive benefits including member discounts, points rewards, and special offers!'}
                      </p>
                      {!showVerificationInput && (
                        <button 
                          className="btn btn-sm"
                          style={{
                            background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)',
                            border: 'none',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '8px',
                            padding: '0.5rem 1.25rem',
                            boxShadow: '0 4px 12px rgba(201, 169, 97, 0.25)',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={handleSendVerificationEmail}
                          disabled={isVerifyingEmail}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(201, 169, 97, 0.35)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 169, 97, 0.25)';
                          }}
                        >
                          {isVerifyingEmail ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              {t('profile.sending') || 'Sending...'}
                            </>
                          ) : (
                            <>
                              <FaEnvelope className="me-2" /> {t('profile.sendVerification') || 'Send Verification Code'}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showVerificationInput && !user.emailConfirmed && (
              <div className="info-row">
                <div className="alert alert-info mb-0" style={{ 
                  fontSize: '0.875rem', 
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(224, 240, 255, 0.8) 0%, rgba(240, 248, 255, 0.8) 100%)',
                  border: '2px solid rgba(201, 169, 97, 0.3)'
                }}>
                  <div className="d-flex align-items-start mb-3">
                    <FaEnvelope className="me-2 mt-1" style={{ color: '#C9A961', fontSize: '1.1rem' }} />
                    <div className="flex-grow-1">
                      <label className="form-label fw-bold mb-2" style={{ color: '#2C2C2C' }}>
                        {t('profile.enterCode') || 'Enter Verification Code (6 digits)'}
                      </label>
                      <p className="text-muted small mb-3" style={{ fontSize: '0.8rem' }}>
                        {t('profile.codeSentDesc') || "We've sent a 6-digit verification code to your email. Enter it below to verify your email and unlock member benefits."}
                      </p>
                      <div className="d-flex gap-2 align-items-center">
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setVerificationCode(value);
                          }}
                          maxLength={6}
                          style={{
                            textAlign: 'center',
                            fontSize: '1.5rem',
                            letterSpacing: '0.5rem',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            border: '2px solid rgba(201, 169, 97, 0.3)',
                            borderRadius: '10px',
                            padding: '0.75rem',
                            maxWidth: '200px'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#C9A961';
                            e.target.style.boxShadow = '0 0 0 3px rgba(201, 169, 97, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(201, 169, 97, 0.3)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <button 
                          className="btn btn-sm"
                          style={{
                            background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)',
                            border: 'none',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '8px',
                            padding: '0.5rem 1.5rem',
                            boxShadow: '0 4px 12px rgba(201, 169, 97, 0.25)',
                            minWidth: '100px'
                          }}
                          onClick={handleVerifyEmail}
                          disabled={isVerifyingEmail || verificationCode.length !== 6}
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(201, 169, 97, 0.35)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 169, 97, 0.25)';
                          }}
                        >
                          {isVerifyingEmail ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              {t('profile.verifying') || 'Verifying...'}
                            </>
                          ) : (
                            t('profile.verify') || 'Verify'
                          )}
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-secondary" 
                          style={{
                            borderRadius: '8px',
                            padding: '0.5rem 1rem'
                          }}
                          onClick={() => {
                            setShowVerificationInput(false);
                            setVerificationCode('');
                          }}
                        >
                          {t('common.cancel') || 'Cancel'}
                        </button>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {process.env.NODE_ENV === 'development' && 'Development mode: Check the success message for the code.'}
                          {process.env.NODE_ENV !== 'development' && 'Check your email for the 6-digit verification code.'}
                        </small>
                        <button
                          className="btn btn-link p-0"
                          style={{ 
                            fontSize: '0.75rem',
                            color: '#C9A961',
                            textDecoration: 'none'
                          }}
                          onClick={handleSendVerificationEmail}
                          disabled={isVerifyingEmail}
                        >
                          {t('profile.resendCode') || 'Resend Code'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">{t('profile.phoneNumber') || 'Phone Number'}</span>
              <span className="info-value">{user.phoneNumber || '-'}</span>
            </div>
          </div>

          {/* Account Security */}
          <div className="detail-card">
            <h3 className="mb-4"><FaLock /> {t('profile.accountSecurity') || 'Account Security'}</h3>
            <div className="info-row">
              <span className="info-label">{t('login.password') || 'Password'}</span>
              <button className="btn-outline-gold btn-sm" onClick={() => setIsChangePasswordOpen(true)}>{t('profile.changePassword') || 'Change Password'}</button>
            </div>
            <div className="info-row">
              <span className="info-label">{t('profile.status') || 'Status'}</span>
              <span className="badge bg-success text-white"><FaCheckCircle className="me-1"/> {t('profile.active') || 'Active'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <EditFormModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title={t('profile.editProfile') || 'Edit Profile'}
        onSubmit={handleUpdateProfile}
        submitText={t('profile.saveChanges') || 'Save Changes'}
      >
        <div className="mb-4 text-center">
            <div className="mb-3">
                <ImageUpload 
                    existingImages={profileData.profilePictureUrl ? [profileData.profilePictureUrl] : []}
                    maxImages={1}
                    title="Profile Picture"
                    onUploadComplete={(url) => setProfileData({...profileData, profilePictureUrl: url})}
                    onDelete={() => setProfileData({...profileData, profilePictureUrl: ''})}
                />
            </div>
        </div>
        <div className="row">
            <div className="col-md-6 mb-3">
                <label className="form-label">{t('profile.firstName') || 'First Name'}</label>
                <input type="text" className="form-control" value={profileData.firstName} onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} required />
            </div>
            <div className="col-md-6 mb-3">
                <label className="form-label">{t('profile.lastName') || 'Last Name'}</label>
                <input type="text" className="form-control" value={profileData.lastName} onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} required />
            </div>
        </div>
        <div className="mb-3">
            <label className="form-label">{t('profile.email') || 'Email'}</label>
            <input type="email" className="form-control" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} required />
        </div>
        <div className="mb-3">
            <label className="form-label">{t('profile.phoneNumber') || 'Phone Number'}</label>
            <input type="text" className="form-control" value={profileData.phoneNumber} onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})} placeholder="Enter phone number" />
        </div>
      </EditFormModal>

      {/* Change Password Modal */}
      <EditFormModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        title={t('profile.changePassword') || 'Change Password'}
        onSubmit={handleChangePassword}
        submitText={t('profile.updatePassword') || 'Update Password'}
      >
        <div className="mb-3">
          <label className="form-label">{t('profile.currentPassword') || 'Current Password'}</label>
          <input type="password" className="form-control" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
        </div>
        <div className="mb-3">
          <label className="form-label">{t('profile.newPassword') || 'New Password'}</label>
          <input type="password" className="form-control" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
        </div>
        <div className="mb-3">
          <label className="form-label">{t('profile.confirmNewPassword') || 'Confirm New Password'}</label>
          <input type="password" className="form-control" value={passwordData.confirmNewPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })} required />
        </div>
      </EditFormModal>


      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Profile;
