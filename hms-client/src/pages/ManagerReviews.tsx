import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { reviewsApi, Review, ReviewStats } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatsCard from '../components/dashboard/StatsCard';
import { FaStar, FaUser, FaCalendarAlt, FaQuoteLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './ManagerReviews.css';

const ManagerReviews: React.FC = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewsApi.getAll(false), // Fetch all reviews, not just approved
        reviewsApi.getStats()
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Reviews..." />;
  }

  return (
    <div className="manager-reviews-page">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C' }}>User Reviews</h2>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <StatsCard
                title="Average Rating"
                value={stats.averageRating.toFixed(1)}
                icon={<FaStar />}
                iconColor="#C9A961"
              />
            </div>
            <div className="col-md-4">
              <StatsCard
                title="Total Reviews"
                value={stats.totalReviews}
                icon={<FaQuoteLeft />}
                iconColor="#8B6F47"
              />
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100 p-3" style={{ borderRadius: '12px', background: '#fff' }}>
                <h6 className="text-muted text-uppercase small fw-bold mb-3">Rating Distribution</h6>
                <div className="d-flex flex-column gap-2">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="d-flex align-items-center">
                      <span className="me-2 small fw-bold" style={{ width: '10px' }}>{star}</span>
                      <FaStar className="me-2 text-warning" size={12} />
                      <div className="progress flex-grow-1" style={{ height: '6px' }}>
                        <div 
                          className="progress-bar bg-warning" 
                          role="progressbar" 
                          style={{ width: `${(stats.ratingDistribution[star] || 0) / stats.totalReviews * 100}%` }}
                        ></div>
                      </div>
                      <span className="ms-2 small text-muted" style={{ width: '30px', textAlign: 'right' }}>
                        {stats.ratingDistribution[star] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {reviews.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaQuoteLeft size={48} className="mb-3 opacity-25" />
              <p>No reviews found.</p>
            </div>
          ) : (
            <div className="row g-4">
              {reviews.map((review, index) => (
                <div className="col-md-6 col-lg-4" key={review.id}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card h-100 border-0 shadow-sm review-card"
                  >
                    <div className="card-body p-4 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar-circle">
                            <FaUser />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold">{review.userName || 'Anonymous'}</h6>
                            <small className="text-muted d-flex align-items-center gap-1">
                              <FaCalendarAlt size={10} />
                              {new Date(review.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        <div className="rating-badge">
                          <FaStar className="text-white me-1" size={12} />
                          {review.rating}
                        </div>
                      </div>
                      
                      <div className="review-content flex-grow-1">
                        <FaQuoteLeft className="quote-icon" />
                        <p className="mb-0 text-muted">{review.comment || "No comment provided."}</p>
                      </div>

                      <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                        <span className={`badge ${review.isApproved ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {review.isApproved ? 'Approved' : 'Pending'}
                        </span>
                        {review.bookingId && (
                          <small className="text-muted">Booking #{review.bookingId}</small>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerReviews;





