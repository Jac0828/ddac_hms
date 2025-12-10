import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaCrown, FaUser, FaShieldAlt, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { getHotelSettings } from '../utils/hotelSettings';
import './MembershipBenefits.css';

const MembershipBenefits: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const hotelSettings = getHotelSettings();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const getTierBenefits = (tier: string): string[] => {
    const benefits = hotelSettings.membershipBenefits;
    switch (tier.toLowerCase()) {
      case 'member':
        return benefits.member || [];
      case 'silver':
        return benefits.silver || [];
      case 'gold':
        return benefits.gold || [];
      case 'platinum':
        return benefits.platinum || [];
      default:
        return [];
    }
  };

  const allBenefits = new Set<string>();
  ['member', 'silver', 'gold', 'platinum'].forEach(tier => {
    getTierBenefits(tier).forEach(benefit => allBenefits.add(benefit));
  });
  const benefitsList = Array.from(allBenefits);
  const tiers = ['member', 'silver', 'gold', 'platinum'];

  return (
    <div className="membership-benefits-page">
      <div className="container-fluid px-4 py-5">
        {/* Header */}
        <motion.div 
          className="benefits-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/profile" className="back-link mb-3 d-inline-flex align-items-center">
            <FaArrowLeft className="me-2" />
            <span>Back to Profile</span>
          </Link>
          <h1 className="benefits-title">Membership Tiers & Benefits</h1>
          <p className="benefits-subtitle">Compare benefits across all membership levels</p>
        </motion.div>

        {/* Tier Headers */}
        <motion.div 
          className="tier-headers-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="tier-header-item">
            <div className="benefits-label-card">
              <span className="benefits-label-text">BENEFITS</span>
            </div>
          </div>
          {tiers.map((tier) => {
            const isCurrent = (user.membershipTier || 'Member').toLowerCase() === tier;
            let tierIcon = <FaUser />;
            let tierColor = '#8B6F47';
            let tierBg = 'linear-gradient(135deg, rgba(139, 111, 71, 0.1) 0%, rgba(139, 111, 71, 0.05) 100%)';
            if (tier === 'silver') { 
              tierIcon = <FaShieldAlt />; 
              tierColor = '#A0A0A0';
              tierBg = 'linear-gradient(135deg, rgba(160, 160, 160, 0.1) 0%, rgba(160, 160, 160, 0.05) 100%)';
            }
            if (tier === 'gold') { 
              tierIcon = <FaCrown />; 
              tierColor = '#D4AF37';
              tierBg = 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)';
            }
            if (tier === 'platinum') { 
              tierIcon = <FaCrown />; 
              tierColor = '#E5E4E2';
              tierBg = 'linear-gradient(135deg, rgba(229, 228, 226, 0.2) 0%, rgba(229, 228, 226, 0.1) 100%)';
            }
            
            return (
              <div key={tier} className="tier-header-item">
                <motion.div 
                  className={`tier-card ${isCurrent ? 'tier-card-current' : ''}`}
                  style={{
                    background: isCurrent ? 'linear-gradient(135deg, rgba(201, 169, 97, 0.2) 0%, rgba(201, 169, 97, 0.1) 100%)' : tierBg,
                    border: isCurrent ? '3px solid #C9A961' : '2px solid rgba(0,0,0,0.1)',
                    boxShadow: isCurrent ? '0 8px 24px rgba(201, 169, 97, 0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
                    transform: isCurrent ? 'translateY(-4px)' : 'none',
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {isCurrent && (
                    <div className="tier-badge-current">
                      YOUR TIER
                    </div>
                  )}
                  <div className="text-center">
                    <div className="tier-icon-wrapper" style={{ marginTop: isCurrent ? '0.5rem' : '0' }}>
                      <div 
                        className="tier-icon-circle"
                        style={{
                          background: isCurrent ? 'rgba(201, 169, 97, 0.2)' : 'rgba(255,255,255,0.6)',
                          color: tierColor,
                          border: isCurrent ? '3px solid #C9A961' : '2px solid rgba(0,0,0,0.1)',
                        }}
                      >
                        {tierIcon}
                      </div>
                    </div>
                    <h6 className="tier-name">
                      {tier}
                    </h6>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* Benefits Table */}
        <motion.div 
          className="benefits-table-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="benefits-table-wrapper">
            <table className="benefits-table">
              <tbody>
                {benefitsList.map((benefit, idx) => (
                  <motion.tr 
                    key={idx} 
                    className="benefits-table-row"
                    style={{
                      background: idx % 2 === 0 ? 'white' : '#fafafa'
                    }}
                    whileHover={{ 
                      background: 'rgba(201, 169, 97, 0.05)',
                      scale: 1.01
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <td className="benefits-table-cell-benefit">
                      {benefit}
                    </td>
                    {tiers.map((tier) => {
                      const isCurrent = (user.membershipTier || 'Member').toLowerCase() === tier;
                      const hasBenefit = getTierBenefits(tier).includes(benefit);
                      return (
                        <td 
                          key={tier} 
                          className="benefits-table-cell text-center"
                          style={{
                            background: isCurrent && hasBenefit ? 'rgba(201, 169, 97, 0.08)' : 'transparent',
                          }}
                        >
                          {hasBenefit ? (
                            <FaCheckCircle 
                              className="benefits-check-icon"
                              style={{
                                color: isCurrent ? '#C9A961' : '#28a745',
                                filter: isCurrent ? 'drop-shadow(0 2px 6px rgba(201, 169, 97, 0.4))' : 'none'
                              }} 
                            />
                          ) : (
                            <span className="benefits-dash">—</span>
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MembershipBenefits;

