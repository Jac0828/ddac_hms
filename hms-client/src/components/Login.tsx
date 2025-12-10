import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { getHotelSettings } from '../utils/hotelSettings';
import { FaGoogle } from 'react-icons/fa'; // Added icons
import './Auth.css';

const Login: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // Added state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hotelSettings, setHotelSettings] = useState(getHotelSettings());
  const { login, googleLogin: googleLoginContext } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        await googleLoginContext(tokenResponse.access_token);
        
        // Wait for storage update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdminUser = userData.roles?.includes('Admin');
        const isManagerUser = userData.roles?.includes('Manager');
        const isReceptionist = userData.roles?.includes('Receptionist');
        const isHousekeeping = userData.roles?.includes('Housekeeping');
        const isCustomerUser = userData.roles?.includes('Customer');
        
        if (isAdminUser) navigate('/admin');
        else if (isManagerUser) navigate('/manager');
        else if (isReceptionist) navigate('/front-desk');
        else if (isHousekeeping) navigate('/housekeeping');
        else if (isCustomerUser) navigate('/');
        else navigate('/dashboard');
        
      } catch (err: any) {
        console.error('Google Login error:', err);
        // Log detailed error response from backend for debugging
        if (err.response) {
            console.error('Backend Response Status:', err.response.status);
            console.error('Backend Response Data:', err.response.data);
        }
        setError(err.response?.data?.message || 'Google Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google Login onError:', errorResponse);
      setError('Google Login Failed to initialize or was cancelled.');
      setLoading(false);
    }
  });

  useEffect(() => {
    setHotelSettings(getHotelSettings());
    // Check for saved email
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdminUser = userData.roles?.includes('Admin');
      const isCustomerUser = userData.roles?.includes('Customer');
      if (isAdminUser) {
        navigate('/admin');
      } else if (isCustomerUser) {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
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
    <div className="auth-container-split-gold">
      {/* Left Welcome Panel */}
      <motion.div 
        className="auth-welcome-panel-gold"
        variants={itemVariants}
      >
        <div className="welcome-shapes-gold">
          <div className="welcome-shape-gold welcome-shape-large"></div>
          <div className="welcome-shape-gold welcome-shape-medium"></div>
          <div className="welcome-shape-gold welcome-shape-small"></div>
        </div>
        <div className="welcome-content-gold">
          <motion.h1 
            className="welcome-title-gold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {t('login.welcome')}
          </motion.h1>
          <motion.h2 
            className="welcome-subtitle-gold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {hotelSettings.hotelName}
          </motion.h2>
          <motion.p 
            className="welcome-description-gold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {hotelSettings.welcomeDescription || t('login.welcomeDescription')}
          </motion.p>
        </div>
      </motion.div>

      {/* Right Sign-in Panel */}
      <motion.div 
        className="auth-signin-panel-gold"
        variants={itemVariants}
      >
        <motion.div className="signin-header-gold">
          <h2 className="signin-title-gold">{t('login.title')}</h2>
          <p className="signin-subtitle-gold">{t('login.subtitle')}</p>
        </motion.div>

        {error && (
          <motion.div
            className="alert alert-danger auth-alert-gold"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {error}
          </motion.div>
        )}

        <motion.form onSubmit={handleSubmit} className="signin-form-gold" variants={itemVariants}>
          <motion.div className="form-group-gold" variants={itemVariants}>
            <div className="input-wrapper-gold">
              <span className="input-icon-gold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                type="text"
                className="auth-input-gold"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </motion.div>

          <motion.div className="form-group-gold" variants={itemVariants}>
            <div className="input-wrapper-gold">
              <span className="input-icon-gold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input-gold"
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="show-password-btn-gold"
                onClick={() => setShowPassword(!showPassword)}
              >
                {t('login.show')}
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8B6F47', marginTop: '0.25rem', paddingLeft: '0.5rem' }}>
              <small>Protected by standard security protocols.</small>
            </div>
          </motion.div>

          <motion.div className="form-options-gold" variants={itemVariants}>
            <label className="remember-me-gold">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t('login.rememberMe')}</span>
            </label>
            <Link to="#" className="forgot-password-link-gold">{t('login.forgotPassword')}</Link>
          </motion.div>

          <motion.button
            type="submit"
            className="auth-button-primary-gold"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {loading ? (
              <span>
                <span className="spinner"></span> {t('login.loggingIn')}
              </span>
            ) : (
              t('login.submit')
            )}
          </motion.button>

          <div className="auth-separator-gold">
            <span>{t('login.or')}</span>
          </div>

          <div className="d-flex justify-content-center mt-3">
            <motion.button
              type="button"
              className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ 
                height: '48px', 
                borderRadius: '12px', 
                borderColor: 'rgba(201, 169, 97, 0.3)', 
                background: 'white', 
                color: '#4A5568',
                fontSize: '0.9rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
              whileHover={{ scale: 1.02, borderColor: '#C9A961', color: '#C9A961', boxShadow: '0 4px 12px rgba(201, 169, 97, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGoogleLogin()}
            >
              <FaGoogle /> <span>Sign in with Google</span>
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login;
