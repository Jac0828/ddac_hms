import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authApi } from '../services/api';
import { motion } from 'framer-motion';
import PhoneNumberInput from './PhoneNumberInput';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { FaTimes, FaEnvelope } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';
import './Auth.css';

const Register: React.FC = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: '',
  });
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [userId, setUserId] = useState<string>('');
  const { register, updateUser } = useAuth();
  const navigate = useNavigate();
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        datePickerRef.current && 
        !datePickerRef.current.contains(target) &&
        !(target as Element).closest('.date-picker-popup-auth')
      ) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const handleRegisterSuccess = async (responseData: any) => {
    // Show email verification modal
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUserId(userData.id);
    if (!userData.emailConfirmed && responseData?.verificationCode) {
      setShowVerificationModal(true);
    } else {
      const isAdminUser = userData.roles?.includes('Admin');
      navigate(isAdminUser ? '/admin' : '/dashboard');
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setVerificationError('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    setVerificationError('');

    try {
      const result = await authApi.verifyEmail({ userId, code: verificationCode });
      if (result.token) {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        updateUser({ ...userData, emailConfirmed: true }, result.token);
        setShowVerificationModal(false);
        const isAdminUser = userData.roles?.includes('Admin');
        navigate(isAdminUser ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      setVerificationError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const result = await authApi.sendVerificationEmail();
      if (result.verificationCode) {
        // In development, show the code
        alert(`Verification code (dev): ${result.verificationCode}`);
      }
    } catch (err: any) {
      setVerificationError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (value: string | undefined) => {
    setFormData({ ...formData, phoneNumber: value || '' });
  };

  const handleDateChange = (date: Date | null) => {
    setDateOfBirth(date);
    if (date) {
      setFormData({ ...formData, dateOfBirth: format(date, 'yyyy-MM-dd') });
    } else {
      setFormData({ ...formData, dateOfBirth: '' });
    }
    setShowDatePicker(false);
  };

  const handleGenderChange = (direction: 'left' | 'right') => {
    const options = ['Mr', 'Ms'];
    const currentIndex = formData.gender ? options.indexOf(formData.gender) : -1;
    let newIndex;
    
    if (direction === 'left') {
      newIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex >= options.length - 1 ? 0 : currentIndex + 1;
    }
    
    setFormData({ ...formData, gender: options[newIndex] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordMismatch') || 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError(t('register.passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Register user
      const registerResponse = await authApi.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
      });
      
      // Auto-login after registration
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
      });
      
      setTimeout(() => {
        handleRegisterSuccess(registerResponse);
      }, 100);
    } catch (err: any) {
      setError(err.response?.data?.message || t('register.error') || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="auth-container-centered">
      <motion.div 
        className="auth-signin-panel-centered"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="auth-card-split"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="auth-header-split">
            <h2 className="auth-title-split">{t('register.title')}</h2>
            <p className="auth-subtitle-split">{t('register.subtitle')}</p>
          </motion.div>

          {error && (
            <motion.div
              className="alert alert-danger auth-alert"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {error}
            </motion.div>
          )}

          <motion.form onSubmit={handleSubmit} variants={itemVariants} className="auth-form-split">
            {/* First Name & Last Name Row */}
            <div className="form-row-split">
              <motion.div className="form-group-split" variants={itemVariants} style={{ flex: 1 }}>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="auth-input-split"
                    id="firstName"
                    name="firstName"
                    placeholder={t('register.firstName')}
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </motion.div>
              <motion.div className="form-group-split" variants={itemVariants} style={{ flex: 1 }}>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="auth-input-split"
                    id="lastName"
                    name="lastName"
                    placeholder={t('register.lastName')}
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </motion.div>
            </div>

            {/* Gender & Date of Birth Row */}
            <div className="form-row-split">
              <motion.div className="form-group-split" variants={itemVariants} style={{ flex: 1 }}>
                <div className="input-wrapper gender-selector-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <div className="gender-selector">
                    <button
                      type="button"
                      className="gender-nav-button gender-nav-left"
                      onClick={() => handleGenderChange('left')}
                      aria-label="Previous"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <span className="gender-display">
                      {formData.gender || t('register.selectGender')}
                    </span>
                    <button
                      type="button"
                      className="gender-nav-button gender-nav-right"
                      onClick={() => handleGenderChange('right')}
                      aria-label="Next"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <input
                      type="hidden"
                      name="gender"
                      value={formData.gender}
                      required
                    />
                  </div>
                </div>
              </motion.div>
              <motion.div className="form-group-split" variants={itemVariants} style={{ flex: 1 }}>
                <div className="input-wrapper date-input-wrapper" ref={datePickerRef}>
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="auth-input-split date-input-with-label"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={dateOfBirth ? format(dateOfBirth, 'dd MMMM yyyy') : ''}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    readOnly
                    required
                    placeholder={t('register.dateOfBirth')}
                  />
                  {showDatePicker && (
                    <div className="date-picker-popup-auth">
                      <DatePicker
                        selected={dateOfBirth}
                        onChange={handleDateChange}
                        maxDate={new Date()}
                        inline
                        calendarClassName="auth-date-picker-calendar"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Phone Number */}
            <motion.div className="form-group-split" variants={itemVariants}>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <PhoneNumberInput
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  className="auth-input-split"
                  style={{ paddingLeft: '3.5rem' }}
                  showFlag={true}
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div className="form-group-split" variants={itemVariants}>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <input
                  type="email"
                  className="auth-input-split"
                  id="email"
                  name="email"
                  placeholder={t('register.email')}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div className="form-group-split" variants={itemVariants}>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <input
                  type="password"
                  className="auth-input-split"
                  id="password"
                  name="password"
                  placeholder={t('register.password')}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </motion.div>

            {/* Confirm Password */}
            <motion.div className="form-group-split" variants={itemVariants}>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V17" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <input
                  type="password"
                  className="auth-input-split"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder={t('register.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </motion.div>

            <motion.button
              type="submit"
              className="auth-button-primary"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {loading ? (
                <span>
                  <span className="spinner"></span> {t('register.creatingAccount')}
                </span>
              ) : (
                t('register.submit')
              )}
            </motion.button>
          </motion.form>

          <motion.div
            className="auth-footer-split"
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p>
              {t('register.haveAccount')}{' '}
              <Link to="/login" className="auth-link-split">
                {t('register.signIn')}
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Email Verification Modal */}
      {showVerificationModal && (
        <motion.div
          className="verification-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            // Allow closing modal - user can verify later
            setShowVerificationModal(false);
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const isAdminUser = userData.roles?.includes('Admin');
            navigate(isAdminUser ? '/admin' : '/dashboard');
          }}
        >
          <motion.div
            className="verification-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="verification-modal-header">
              <h3>Verify Your Email</h3>
              <button
                className="verification-modal-close"
                onClick={() => {
                  setShowVerificationModal(false);
                  const userData = JSON.parse(localStorage.getItem('user') || '{}');
                  const isAdminUser = userData.roles?.includes('Admin');
                  navigate(isAdminUser ? '/admin' : '/dashboard');
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="verification-modal-body">
              <div className="verification-notice">
                <FaEnvelope className="verification-icon" />
                <p className="verification-text">
                  <strong>Verify your email to become a member!</strong>
                </p>
                <p className="verification-subtext">
                  We've sent a 6-digit verification code to your email. Enter the code below to verify your email and unlock member benefits.
                </p>
              </div>
              <div className="verification-input-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  className="verification-code-input"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setVerificationError('');
                  }}
                  maxLength={6}
                  style={{
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    letterSpacing: '0.5rem',
                    fontFamily: 'monospace',
                    fontWeight: 'bold'
                  }}
                />
                {verificationError && (
                  <p className="verification-error">{verificationError}</p>
                )}
              </div>
              <div className="verification-actions">
                <button
                  className="verification-btn secondary"
                  onClick={handleResendCode}
                >
                  Resend Code
                </button>
                <button
                  className="verification-btn primary"
                  onClick={handleVerifyCode}
                  disabled={verificationCode.length !== 6 || verifying}
                >
                  {verifying ? 'Verifying...' : 'Verify Email'}
                </button>
              </div>
              <p className="verification-skip">
                You can verify later from your profile. You can still use the system without verification.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Register;
