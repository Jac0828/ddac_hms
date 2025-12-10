import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout, isAdmin, isManager, isReceptionist, isRoomAttendant, isCustomer } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLLIElement>(null);
  const currencyDropdownRef = useRef<HTMLLIElement>(null);

  const languageNames: Record<string, string> = {
    en: 'English',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español',
    pt: 'Português',
    ar: 'العربية',
    th: 'ไทย',
  };

  const currencySymbols: Record<string, string> = {
    USD: '$',
    CNY: '¥',
    JPY: '¥',
    EUR: '€',
    GBP: '£',
    KRW: '₩',
    SGD: 'S$',
    HKD: 'HK$',
    THB: '฿',
    AUD: 'A$',
    CAD: 'C$',
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    };

    if (showDropdown || showLanguageDropdown || showCurrencyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showLanguageDropdown, showCurrencyDropdown]);

  return (
    <>
      {/* Main Navigation */}
      <nav className="navbar navbar-expand-lg navbar-luxury">
        <div className="container-fluid px-4">
          <Link 
            className="navbar-brand luxury-brand" 
            to={isAuthenticated && (isAdmin || isManager || isReceptionist || isRoomAttendant) 
              ? (isAdmin ? '/admin' : '/dashboard') 
              : '/'}
          >
            <span className="brand-icon">🏨</span>
            <span className="brand-text">HMS</span>
          </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav luxury-nav">
            {/* Admin-specific navigation */}
            {isAdmin ? (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link luxury-nav-link ${location.pathname === '/admin' && (!location.search || location.search.includes('tab=overview')) ? 'active' : ''}`}
                    to="/admin?tab=overview"
                  >
                    {t('nav.overview')}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link luxury-nav-link ${location.search.includes('tab=users') ? 'active' : ''}`}
                    to="/admin?tab=users"
                  >
                    {t('nav.users')}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link luxury-nav-link ${location.search.includes('tab=rooms') ? 'active' : ''}`}
                    to="/admin?tab=rooms"
                  >
                    {t('nav.rooms')}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link luxury-nav-link ${location.search.includes('tab=bookings') ? 'active' : ''}`}
                    to="/admin?tab=bookings"
                  >
                    {t('nav.bookings')}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link luxury-nav-link ${location.search.includes('tab=services') ? 'active' : ''}`}
                    to="/admin?tab=services"
                  >
                    {t('nav.serviceRequests')}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link luxury-nav-link ${location.search.includes('tab=settings') ? 'active' : ''}`}
                    to="/admin?tab=settings"
                  >
                    {t('nav.settings')}
                  </Link>
                </li>
              </>
            ) : (
              <>
                {/* Home link - only for guests and customers */}
                {(!isAuthenticated || isCustomer) && (
                  <li className="nav-item">
                    <Link className="nav-link luxury-nav-link" to="/">
                      {t('nav.home')}
                    </Link>
                  </li>
                )}
                {/* Dashboard link - for authenticated non-admin users, excluding customers */}
                {isAuthenticated && !isAdmin && !isCustomer && (
                  <li className="nav-item">
                    <Link className="nav-link luxury-nav-link" to="/dashboard">
                      {t('nav.dashboard')}
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className="nav-link luxury-nav-link" to="/rooms">
                    {t('nav.rooms')}
                  </Link>
                </li>
                {isAuthenticated && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link luxury-nav-link" to="/bookings">
                        {isManager || isReceptionist ? t('nav.bookings') : t('nav.myBookings')}
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link luxury-nav-link" to="/service-requests">
                        {t('nav.services')}
                      </Link>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>
          <ul className="navbar-nav luxury-nav-right">
            {/* Language Selector */}
            <li className="nav-item dropdown luxury-language-dropdown" ref={languageDropdownRef}>
              <a
                className="nav-link luxury-nav-link luxury-language-link"
                href="#"
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowLanguageDropdown(!showLanguageDropdown);
                  setShowCurrencyDropdown(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <span className="language-icon" style={{ color: '#C9A961' }}>🌐</span>
              </a>
              {showLanguageDropdown && (
                <ul className="dropdown-menu dropdown-menu-end luxury-dropdown luxury-dropdown-scrollable show" style={{ display: 'block' }}>
                  {Object.entries(languageNames).map(([code, name]) => (
                    <li key={code}>
                      <a
                        className={`dropdown-item luxury-dropdown-item ${language === code ? 'active' : ''}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setLanguage(code as any);
                          setShowLanguageDropdown(false);
                        }}
                        style={{ color: language === code ? '#C9A961' : 'inherit', fontWeight: language === code ? 'bold' : 'normal' }}
                      >
                        {name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            
            {/* Currency Selector - Only for Guests and Customers */}
            {(!isAuthenticated || isCustomer) && (
              <li className="nav-item dropdown luxury-currency-dropdown" ref={currencyDropdownRef}>
                <a
                  className="nav-link luxury-nav-link luxury-currency-link"
                  href="#"
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCurrencyDropdown(!showCurrencyDropdown);
                    setShowLanguageDropdown(false);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="currency-text">{currencySymbols[currency]}</span>
                </a>
                {showCurrencyDropdown && (
                  <ul className="dropdown-menu dropdown-menu-end luxury-dropdown luxury-dropdown-scrollable show" style={{ display: 'block' }}>
                    {[
                      { code: 'USD', symbol: '$', name: 'US Dollar' },
                      { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
                      { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
                      { code: 'EUR', symbol: '€', name: 'Euro' },
                      { code: 'GBP', symbol: '£', name: 'British Pound' },
                      { code: 'KRW', symbol: '₩', name: 'Korean Won' },
                      { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
                      { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
                      { code: 'THB', symbol: '฿', name: 'Thai Baht' },
                      { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
                      { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
                    ].map((curr) => (
                      <li key={curr.code}>
                        <a
                          className={`dropdown-item luxury-dropdown-item ${currency === curr.code ? 'active' : ''}`}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrency(curr.code as any);
                            setShowCurrencyDropdown(false);
                          }}
                          style={{ color: currency === curr.code ? '#C9A961' : 'inherit', fontWeight: currency === curr.code ? 'bold' : 'normal' }}
                        >
                          {curr.code} ({curr.symbol})
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}

            {isAuthenticated ? (
              <li className="nav-item dropdown" ref={dropdownRef}>
                <a
                  className="nav-link luxury-nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDropdown(!showDropdown);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {user?.firstName} {user?.lastName}
                </a>
                {showDropdown && (
                  <ul className="dropdown-menu dropdown-menu-end luxury-dropdown show" style={{ display: 'block' }}>
                    <li>
                      <Link
                        className="dropdown-item luxury-dropdown-item"
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                      >
                        {t('nav.profile')}
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <a
                        className="dropdown-item luxury-dropdown-item"
                        href="#"
                        onClick={handleLogout}
                        style={{ cursor: 'pointer' }}
                      >
                        {t('nav.logout')}
                      </a>
                    </li>
                  </ul>
                )}
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link luxury-nav-link" to="/login">
                    {t('nav.signIn')}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link luxury-nav-link luxury-nav-button" to="/register">
                    {t('nav.joinNow')}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
      </nav>
    </>
  );
};

export default Navbar;

