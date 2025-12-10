import React, { useState, useEffect } from 'react';
import { FaHotel, FaPhone, FaClock, FaShareAlt, FaBuilding, FaBell, FaPlus, FaTrash, FaImage, FaInfoCircle, FaTags } from 'react-icons/fa';
import { ParsedHotelSetting, FeaturedOffer } from '../../services/api';
import ImageUpload from '../common/ImageUpload';
import LuxurySelect from '../common/LuxurySelect';
import axios from 'axios';

interface SettingsTabProps {
  initialSettings: ParsedHotelSetting | null;
  onUpdateSettings: (settings: ParsedHotelSetting) => Promise<void>;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
}

const STANDARD_BENEFITS = [
  "Standard Member Rates",
  "Free WiFi",
  "Late Check-out",
  "Early Check-in",
  "Room Upgrade (Subject to availability)",
  "Welcome Drink",
  "Executive Lounge Access",
  "Welcome Gift",
  "Free Breakfast",
  "Spa Discount",
  "Free Parking",
  "Priority Support",
  "Daily Newspaper"
];

const SettingsTab: React.FC<SettingsTabProps> = ({ initialSettings, onUpdateSettings, showSuccess, showError }) => {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [hotelSettings, setHotelSettings] = useState<ParsedHotelSetting>({
    hotelName: '', welcomeDescription: '', email: '', phone: '', address: '',
    checkInTime: '', checkOutTime: '', taxRate: 0, currency: 'USD',
    facebookUrl: '', instagramUrl: '', twitterUrl: '',
    memberDiscount: 0, silverDiscount: 0, goldDiscount: 0, platinumDiscount: 0,
    membershipBenefits: { member: [], silver: [], gold: [], platinum: [] },
    homeBannerImages: [],
    featuredOffers: [],
    promotionTitle: '',
    promotionDescription: '',
    promotionImageUrl: '',
    aboutTitle: '',
    aboutDescription: '',
    aboutImageUrl: ''
  });
  
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    if (initialSettings) {
      setHotelSettings({
        ...initialSettings,
        membershipBenefits: initialSettings.membershipBenefits || { member: [], silver: [], gold: [], platinum: [] },
        // Ensure homeBannerImages is a valid array and filter out empty strings
        homeBannerImages: Array.isArray(initialSettings.homeBannerImages) 
          ? initialSettings.homeBannerImages.filter(url => url && typeof url === 'string' && url.trim() !== '') 
          : [],
        featuredOffers: Array.isArray(initialSettings.featuredOffers) ? initialSettings.featuredOffers : []
      });
    }
  }, [initialSettings]);

  const allBenefits = React.useMemo(() => {
     const existingCustomBenefits = Array.from(new Set(
      ['member', 'silver', 'gold', 'platinum'].flatMap(tier => 
        hotelSettings.membershipBenefits?.[tier as keyof typeof hotelSettings.membershipBenefits] || []
      )
    )).filter(b => !STANDARD_BENEFITS.includes(b));
    
    return [...STANDARD_BENEFITS, ...existingCustomBenefits]
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [hotelSettings.membershipBenefits]);

  const handleAddBenefit = () => {
    if (newBenefit && !allBenefits.includes(newBenefit)) {
      // Just clear input, benefit is added when checked
      setNewBenefit('');
    }
  };

  const handleDeleteBenefit = (benefit: string) => {
    const newBenefitsState = { ...hotelSettings.membershipBenefits };
    ['member', 'silver', 'gold', 'platinum'].forEach(tier => {
      const t = tier as keyof typeof newBenefitsState;
      if (newBenefitsState[t]) {
        newBenefitsState[t] = newBenefitsState[t].filter(b => b !== benefit);
      }
    });
    setHotelSettings(prev => ({ ...prev, membershipBenefits: newBenefitsState }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      // DIRECT DEBUG REQUEST (Copying logic from Admin.tsx to ensure it works)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5024';
      const url = `${API_BASE_URL}/api/admin/settings`;
      
      const token = localStorage.getItem('jwtToken');
      const payload = {
        ...hotelSettings,
        membershipBenefitsJson: JSON.stringify(hotelSettings.membershipBenefits),
        homeBannerImagesJson: JSON.stringify(hotelSettings.homeBannerImages),
        featuredOffersJson: JSON.stringify(hotelSettings.featuredOffers)
      };
      
      await axios.put(url, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update context
      await onUpdateSettings(hotelSettings);
      
      showSuccess('Success', 'Settings saved successfully');
    } catch (error: any) {
      console.error('Save settings error:', error);
      showError('Error', `Failed to save settings: ${error.response?.status} ${error.response?.statusText}`);
    }
  };

  return (
    <div className="settings-page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C', margin: 0 }}>Hotel Configuration</h4>
        <button 
          onClick={() => handleSubmit()}
          className="btn btn-primary"
          style={{ 
            background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', 
            border: 'none', 
            borderRadius: '10px', 
            padding: '0.6rem 1.5rem', 
            fontWeight: 600, 
            boxShadow: '0 4px 12px rgba(139, 111, 71, 0.25)'
          }}
        >
          Save Changes
        </button>
      </div>

      <div className="settings-tabs mb-4" style={{ borderBottom: '1px solid rgba(201, 169, 97, 0.2)', paddingBottom: '0', display: 'flex', gap: '2rem' }}>
        {['general', 'home', 'policies', 'membership'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeSubTab === tab ? 'active' : ''}`}
            style={{ 
              borderRadius: '0', 
              padding: '1rem 0.5rem',
              background: 'transparent',
              color: activeSubTab === tab ? '#2C2C2C' : '#8B6F47',
              border: 'none',
              borderBottom: activeSubTab === tab ? '3px solid #C9A961' : '3px solid transparent',
              fontWeight: activeSubTab === tab ? 700 : 500,
              fontSize: '1.1rem',
              fontFamily: '"Playfair Display", serif',
              opacity: activeSubTab === tab ? 1 : 0.7,
              transition: 'all 0.3s ease',
              marginBottom: '-1px'
            }}
            onClick={() => setActiveSubTab(tab)}
          >
            {tab === 'home' ? 'Home Page' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* General Tab */}
        {activeSubTab === 'general' && (
          <div className="settings-container fade-in">
            <div className="row g-4">
              <div className="col-md-4">
                <div className="settings-card h-100">
                  <div className="settings-header">
                    <div className="settings-icon-wrapper"><FaHotel /></div>
                    <h5 className="settings-title">General Information</h5>
                  </div>
                  
                  <div className="luxury-input-group">
                    <label className="luxury-label">Hotel Name</label>
                    <input 
                      className="luxury-input" 
                      value={hotelSettings.hotelName} 
                      onChange={e => setHotelSettings({...hotelSettings, hotelName: e.target.value})} 
                      placeholder="Enter hotel name"
                    />
                  </div>
                  
                  <div className="luxury-input-group">
                    <label className="luxury-label">Welcome Description</label>
                    <textarea 
                      className="luxury-input" 
                      rows={4} 
                      value={hotelSettings.welcomeDescription} 
                      onChange={e => setHotelSettings({...hotelSettings, welcomeDescription: e.target.value})} 
                      placeholder="Enter a welcoming description for your guests..."
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="settings-card h-100">
                  <div className="settings-header">
                    <div className="settings-icon-wrapper"><FaPhone /></div>
                    <h5 className="settings-title">Contact Details</h5>
                  </div>
                  
                  <div className="luxury-input-group">
                    <label className="luxury-label">Email Address</label>
                    <input 
                      className="luxury-input" 
                      type="email" 
                      value={hotelSettings.email || ''} 
                      onChange={e => setHotelSettings({...hotelSettings, email: e.target.value})} 
                      placeholder="contact@hotel.com"
                    />
                  </div>
                  
                  <div className="luxury-input-group">
                    <label className="luxury-label">Phone Number</label>
                    <input 
                      className="luxury-input" 
                      value={hotelSettings.phone || ''} 
                      onChange={e => setHotelSettings({...hotelSettings, phone: e.target.value})} 
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  
                  <div className="luxury-input-group">
                    <label className="luxury-label">Address</label>
                    <input 
                      className="luxury-input" 
                      value={hotelSettings.address || ''} 
                      onChange={e => setHotelSettings({...hotelSettings, address: e.target.value})} 
                      placeholder="123 Luxury Ave, City, Country"
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="settings-card h-100">
                  <div className="settings-header">
                    <div className="settings-icon-wrapper"><FaShareAlt /></div>
                    <h5 className="settings-title">Social Media</h5>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    <div className="luxury-input-group mb-0">
                      <label className="luxury-label">Facebook URL</label>
                      <input className="luxury-input" value={hotelSettings.facebookUrl || ''} onChange={e => setHotelSettings({...hotelSettings, facebookUrl: e.target.value})} placeholder="https://facebook.com/..." />
                    </div>
                    <div className="luxury-input-group mb-0">
                      <label className="luxury-label">Instagram URL</label>
                      <input className="luxury-input" value={hotelSettings.instagramUrl || ''} onChange={e => setHotelSettings({...hotelSettings, instagramUrl: e.target.value})} placeholder="https://instagram.com/..." />
                    </div>
                    <div className="luxury-input-group mb-0">
                      <label className="luxury-label">Twitter URL</label>
                      <input className="luxury-input" value={hotelSettings.twitterUrl || ''} onChange={e => setHotelSettings({...hotelSettings, twitterUrl: e.target.value})} placeholder="https://twitter.com/..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Home Page Tab */}
        {activeSubTab === 'home' && (
          <div className="settings-container fade-in">
            {/* Banner Images Section */}
            <div className="settings-card mb-4">
              <div className="settings-header border-bottom pb-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="settings-icon-wrapper" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
                    <FaImage />
                  </div>
                  <div>
                    <h5 className="settings-title mb-1" style={{ fontSize: '1.25rem' }}>Hero Banner Images</h5>
                    <small className="text-muted">Manage the slideshow images displayed on the main home page</small>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <div className="alert alert-light border d-flex align-items-center gap-3 mb-4" style={{ borderRadius: '12px', background: 'rgba(201, 169, 97, 0.05)', borderColor: 'rgba(201, 169, 97, 0.2)' }}>
                  <FaInfoCircle style={{ color: '#C9A961', fontSize: '1.2rem' }} />
                  <div className="text-muted small">
                    <strong>Recommended Size:</strong> 1920x800 pixels or higher resolution. Supports JPG, PNG, WEBP.
                  </div>
                </div>

                <ImageUpload 
                  existingImages={hotelSettings.homeBannerImages || []}
                  maxImages={5}
                  title="Upload Banner Images"
                  onUploadComplete={(url) => {
                    setHotelSettings(prev => ({
                      ...prev,
                      homeBannerImages: [...(Array.isArray(prev.homeBannerImages) ? prev.homeBannerImages : []), url]
                    }));
                  }}
                  onDelete={(url) => {
                    setHotelSettings(prev => ({
                      ...prev,
                      homeBannerImages: (Array.isArray(prev.homeBannerImages) ? prev.homeBannerImages : []).filter(u => u !== url)
                    }));
                  }}
                />
              </div>
            </div>

            {/* Featured Offers Section - Full Width Row */}
            <div className="settings-card mb-4">
              <div className="settings-header border-bottom pb-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="settings-icon-wrapper" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
                    <FaTags />
                  </div>
                  <div className="d-flex justify-content-between w-100 align-items-center">
                    <div>
                        <h5 className="settings-title mb-1" style={{ fontSize: '1.25rem' }}>Featured Offers</h5>
                        <small className="text-muted">Manage the offer cards displayed on the home page</small>
                    </div>
                    <button 
                        type="button"
                        className="btn btn-outline-primary btn-sm" 
                        onClick={() => setHotelSettings({
                            ...hotelSettings,
                            featuredOffers: [...(hotelSettings.featuredOffers || []), { title: 'New Offer', description: '', tags: [], price: '', priceLabel: 'Average Per Night' }]
                        })}
                    >
                        <FaPlus className="me-2" /> Add Offer
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <div className="row">
                    {(hotelSettings.featuredOffers || []).map((offer, index) => (
                        <div className="col-12 mb-4" key={index}>
                            <div className="card h-100 shadow-sm border-0" style={{ background: '#fcfcfc' }}>
                                <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                                    <span className="fw-bold text-muted">Offer #{index + 1}</span>
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline-danger border-0"
                                        onClick={() => {
                                            const newOffers = [...hotelSettings.featuredOffers];
                                            newOffers.splice(index, 1);
                                            setHotelSettings({...hotelSettings, featuredOffers: newOffers});
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label small text-muted text-uppercase fw-bold">Title</label>
                                                <input 
                                                    className="form-control" 
                                                    value={offer.title} 
                                                    onChange={e => {
                                                        const newOffers = [...hotelSettings.featuredOffers];
                                                        newOffers[index].title = e.target.value;
                                                        setHotelSettings({...hotelSettings, featuredOffers: newOffers});
                                                    }}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small text-muted text-uppercase fw-bold">Description</label>
                                                <textarea 
                                                    className="form-control" 
                                                    rows={3}
                                                    value={offer.description} 
                                                    onChange={e => {
                                                        const newOffers = [...hotelSettings.featuredOffers];
                                                        newOffers[index].description = e.target.value;
                                                        setHotelSettings({...hotelSettings, featuredOffers: newOffers});
                                                    }}
                                                />
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-6">
                                                    <label className="form-label small text-muted text-uppercase fw-bold">Price</label>
                                                    <input 
                                                        className="form-control" 
                                                        value={offer.price || ''} 
                                                        onChange={e => {
                                                            const newOffers = [...hotelSettings.featuredOffers];
                                                            newOffers[index].price = e.target.value;
                                                            setHotelSettings({...hotelSettings, featuredOffers: newOffers});
                                                        }}
                                                        placeholder="1500"
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small text-muted text-uppercase fw-bold">Label</label>
                                                    <input 
                                                        className="form-control" 
                                                        value={offer.priceLabel || ''} 
                                                        onChange={e => {
                                                            const newOffers = [...hotelSettings.featuredOffers];
                                                            newOffers[index].priceLabel = e.target.value;
                                                            setHotelSettings({...hotelSettings, featuredOffers: newOffers});
                                                        }}
                                                        placeholder="/ night"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label small text-muted text-uppercase fw-bold">Tags</label>
                                                <input 
                                                    className="form-control" 
                                                    value={(offer.tags || []).join(', ')} 
                                                    onChange={e => {
                                                        const newOffers = [...hotelSettings.featuredOffers];
                                                        newOffers[index].tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                                                        setHotelSettings({...hotelSettings, featuredOffers: newOffers});
                                                    }}
                                                    placeholder="Stay, Breakfast Included"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small text-muted text-uppercase fw-bold">Badge</label>
                                                <input 
                                                    className="form-control" 
                                                    value={offer.badge || ''} 
                                                    onChange={e => {
                                                        const newOffers = [...hotelSettings.featuredOffers];
                                                        newOffers[index].badge = e.target.value;
                                                        setHotelSettings({...hotelSettings, featuredOffers: newOffers});
                                                    }}
                                                    placeholder="MEMBER EXCLUSIVE"
                                                />
                                            </div>
                                            
                                            <div className="mb-3">
                                                <label className="form-label small text-muted text-uppercase fw-bold">Offer Image</label>
                                                <div className="bg-light rounded p-2 border">
                                                    <ImageUpload 
                                                        existingImages={offer.imageUrl ? [offer.imageUrl] : []}
                                                        maxImages={1}
                                                        title=""
                                                        onUploadComplete={(url) => {
                                                            const newOffers = [...hotelSettings.featuredOffers];
                                                            newOffers[index].imageUrl = url;
                                                            setHotelSettings({...hotelSettings, featuredOffers: newOffers});
                                                        }}
                                                        onDelete={() => {
                                                            const newOffers = [...hotelSettings.featuredOffers];
                                                            newOffers[index].imageUrl = '';
                                                            setHotelSettings({...hotelSettings, featuredOffers: newOffers});
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {(hotelSettings.featuredOffers || []).length === 0 && (
                    <div className="text-center p-5 text-muted bg-light rounded border border-dashed">
                        <FaTags size={32} className="mb-3 opacity-50" />
                        <p className="mb-0">No featured offers. Add one to display on the home page.</p>
                    </div>
                )}
              </div>
            </div>

            {/* Promotion Section - Full Width (REMOVED as per request) */}
            {/* 
            <div className="settings-card mb-4">
              ...
            </div>
            */}

            {/* About Section - Full Width */}
            <div className="settings-card mb-4">
              <div className="settings-header border-bottom pb-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="settings-icon-wrapper" style={{ width: '40px', height: '40px' }}>
                    <FaBuilding />
                  </div>
                  <div>
                    <h5 className="settings-title mb-0">About Section</h5>
                    <small className="text-muted">"About Us" content on Home page</small>
                  </div>
                </div>
              </div>
              
              <div className="luxury-input-group mb-4">
                <label className="luxury-label">Section Title</label>
                <input 
                  className="luxury-input" 
                  value={hotelSettings.aboutTitle || ''} 
                  onChange={e => setHotelSettings({...hotelSettings, aboutTitle: e.target.value})} 
                  placeholder="About Our Hotel"
                />
              </div>

              <div className="row">
                <div className="col-md-8">
                  <div className="luxury-input-group h-100">
                    <label className="luxury-label">Description</label>
                    <textarea 
                      className="luxury-input h-100" 
                      style={{ minHeight: '300px', lineHeight: '1.6' }}
                      value={hotelSettings.aboutDescription || ''} 
                      onChange={e => setHotelSettings({...hotelSettings, aboutDescription: e.target.value})} 
                      placeholder="Share your hotel's story, history, and what makes it unique..."
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="luxury-input-group h-100 d-flex flex-column">
                    <label className="luxury-label mb-2">About Section Image</label>
                    <div className="p-3 bg-light rounded-3 border flex-grow-1 d-flex flex-column justify-content-center">
                      <ImageUpload 
                        existingImages={hotelSettings.aboutImageUrl ? [hotelSettings.aboutImageUrl] : []}
                        maxImages={1}
                        title="Upload About Image"
                        onUploadComplete={(url) => {
                          setHotelSettings(prev => ({
                            ...prev,
                            aboutImageUrl: url
                          }));
                        }}
                        onDelete={() => {
                          setHotelSettings(prev => ({
                            ...prev,
                            aboutImageUrl: ''
                          }));
                        }}
                      />
                      <div className="text-muted small mt-3 text-center">
                        <FaInfoCircle className="me-1" />
                        Optimal size: 800x600px or similar aspect ratio.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeSubTab === 'policies' && (
          <div className="settings-container fade-in">
            <div className="settings-card">
              <div className="settings-header">
                <div className="settings-icon-wrapper"><FaClock /></div>
                <h5 className="settings-title">Policies & Currency</h5>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <div className="luxury-input-group">
                    <label className="luxury-label">Check-in Time</label>
                    <input 
                      className="luxury-input" 
                      type="time" 
                      value={hotelSettings.checkInTime || '15:00'} 
                      onChange={e => setHotelSettings({...hotelSettings, checkInTime: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="luxury-input-group">
                    <label className="luxury-label">Check-out Time</label>
                    <input 
                      className="luxury-input" 
                      type="time" 
                      value={hotelSettings.checkOutTime || '11:00'} 
                      onChange={e => setHotelSettings({...hotelSettings, checkOutTime: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <div className="luxury-input-group">
                    <label className="luxury-label">Tax Rate (%)</label>
                    <input 
                      className="luxury-input" 
                      type="number" 
                      value={hotelSettings.taxRate || 10} 
                      onChange={e => setHotelSettings({...hotelSettings, taxRate: parseFloat(e.target.value)})} 
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="luxury-input-group">
                    <label className="luxury-label">Currency</label>
                    <LuxurySelect 
                      value={hotelSettings.currency || 'USD'} 
                      onChange={(value) => setHotelSettings({...hotelSettings, currency: value})}
                      options={[
                        { value: 'USD', label: 'USD ($)' },
                        { value: 'EUR', label: 'EUR (€)' },
                        { value: 'CNY', label: 'CNY (¥)' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Membership Tab */}
        {activeSubTab === 'membership' && (
          <div className="settings-container fade-in">
            <div className="row">
              <div className="col-12">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom" style={{ borderColor: '#f0e6d2' }}>
                  <div className="mb-3 mb-md-0">
                    <h5 style={{ color: '#8B6F47', fontFamily: 'Playfair Display, serif', margin: 0, fontSize: '1.4rem' }}>Membership Matrix</h5>
                    <small className="text-muted">Manage standard and custom benefits for each tier</small>
                  </div>
                  <div className="d-flex gap-2 align-items-center bg-white p-2 rounded shadow-sm" style={{ border: '1px solid #f0e6d2' }}>
                    <div className="input-group input-group-sm" style={{ minWidth: '300px' }}>
                      <span className="input-group-text bg-transparent border-end-0 text-muted"><FaPlus /></span>
                      <input 
                        className="form-control border-start-0" 
                        style={{ borderColor: '#ced4da' }}
                        placeholder="Type new benefit name..." 
                        value={newBenefit}
                        onChange={e => setNewBenefit(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                      />
                      <button 
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#8B6F47', borderColor: '#8B6F47' }}
                        onClick={handleAddBenefit}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card shadow-sm border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th className="py-4 ps-4" style={{ width: '25%', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#2C2C2C' }}>Benefit / Feature</th>
                          {['Member', 'Silver', 'Gold', 'Platinum'].map(tier => {
                            const styles = {
                              Member: { color: '#6c757d', icon: 'M' },
                              Silver: { color: '#718096', icon: 'S' },
                              Gold: { color: '#B7950B', icon: 'G' },
                              Platinum: { color: '#2d3748', icon: 'P' }
                            }[tier] || { color: '#000', icon: '?' };
                            
                            return (
                              <th key={tier} className="text-center py-4" style={{ width: '18%' }}>
                                <div className="d-flex flex-column align-items-center">
                                  <div style={{ 
                                      width: '32px', height: '32px', 
                                      background: styles.color, color: 'white',
                                      borderRadius: '50%', marginBottom: '8px',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontWeight: 'bold', fontSize: '0.9rem',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}>
                                      {styles.icon}
                                  </div>
                                  <span style={{ color: styles.color, letterSpacing: '1px', fontSize: '0.9rem' }} className="text-uppercase fw-bold">{tier}</span>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Discount Row */}
                        <tr style={{ background: 'rgba(201, 169, 97, 0.05)' }}>
                          <td className="ps-4 fw-bold" style={{ color: '#8B6F47' }}>Discount Percentage</td>
                          {['member', 'silver', 'gold', 'platinum'].map(tier => (
                            <td key={tier} className="text-center py-3">
                              <div className="d-flex align-items-center justify-content-center mx-auto bg-white" 
                                   style={{ 
                                     maxWidth: '140px', 
                                     borderRadius: '12px', 
                                     padding: '8px 12px', 
                                     border: '1px solid #e2e8f0', 
                                     boxShadow: '0 2px 5px rgba(0,0,0,0.03)' 
                                   }}>
                                <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="form-control border-0 p-0 text-center fw-bold shadow-none" 
                                    style={{ fontSize: '1.1rem', color: '#2C2C2C', background: 'transparent' }}
                                    value={(hotelSettings as any)[`${tier}Discount`] || 0}
                                    onChange={e => {
                                        const discount = parseInt(e.target.value) || 0;
                                        setHotelSettings({
                                            ...hotelSettings,
                                            [`${tier}Discount`]: discount
                                        } as any);
                                    }}
                                />
                                <span className="fw-bold ms-2" style={{ color: '#A0AEC0' }}>%</span>
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* All Benefits Rows */}
                        {allBenefits.map(benefit => (
                          <tr key={benefit}>
                            <td className="ps-4 text-muted">
                              <div className="d-flex align-items-center justify-content-between pe-2">
                                <span style={{ fontWeight: !STANDARD_BENEFITS.includes(benefit) ? 500 : 400, color: !STANDARD_BENEFITS.includes(benefit) ? '#2C2C2C' : undefined }}>
                                  {benefit}
                                  {!STANDARD_BENEFITS.includes(benefit) && <span className="badge bg-light text-secondary border ms-2" style={{fontSize: '0.65rem'}}>Custom</span>}
                                </span>
                                {!STANDARD_BENEFITS.includes(benefit) && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 px-2 py-1"
                                    style={{ borderRadius: '6px', fontSize: '0.75rem' }}
                                    onClick={() => handleDeleteBenefit(benefit)}
                                    title="Delete Benefit"
                                  >
                                    <FaTrash /> Delete
                                  </button>
                                )}
                              </div>
                            </td>
                            {['member', 'silver', 'gold', 'platinum'].map(tier => {
                              const currentBenefits = hotelSettings.membershipBenefits?.[tier as keyof typeof hotelSettings.membershipBenefits] || [];
                              const isChecked = currentBenefits.includes(benefit);
                              return (
                                <td key={tier} className="text-center">
                                  <div className="form-check d-flex justify-content-center">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        style={{ width: '1.2em', height: '1.2em', cursor: 'pointer', borderColor: isChecked ? '#8B6F47' : '#cbd5e0', backgroundColor: isChecked ? '#8B6F47' : 'white' }}
                                        checked={isChecked}
                                        onChange={e => {
                                            const isChecking = e.target.checked;
                                            const tiers = ['member', 'silver', 'gold', 'platinum'];
                                            const currentTierIdx = tiers.indexOf(tier.toLowerCase());
                                            
                                            const newBenefitsState = { ...hotelSettings.membershipBenefits } || { member: [], silver: [], gold: [], platinum: [] };
                                            
                                            if (isChecking) {
                                                for (let i = currentTierIdx; i < tiers.length; i++) {
                                                    const t = tiers[i];
                                                    const tierBenefits = newBenefitsState[t as keyof typeof newBenefitsState] || [];
                                                    if (!tierBenefits.includes(benefit)) {
                                                        newBenefitsState[t as keyof typeof newBenefitsState] = [...tierBenefits, benefit];
                                                    }
                                                }
                                            } else {
                                                const tierBenefits = newBenefitsState[tier.toLowerCase() as keyof typeof newBenefitsState] || [];
                                                newBenefitsState[tier.toLowerCase() as keyof typeof newBenefitsState] = tierBenefits.filter(b => b !== benefit);
                                            }

                                            setHotelSettings({
                                                ...hotelSettings,
                                                membershipBenefits: newBenefitsState
                                            });
                                        }}
                                    />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="card-footer bg-light p-3 text-center">
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      <strong>Note:</strong> Higher tiers automatically inherit all benefits from lower tiers on the customer view. You only need to select the <strong>exclusive</strong> benefits for each tier here.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsTab;
