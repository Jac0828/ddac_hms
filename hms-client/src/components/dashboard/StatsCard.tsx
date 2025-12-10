import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import './Dashboard.css';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative';
  icon: React.ReactNode;
  iconColor?: string; // Kept optional for compatibility but ignored in styling
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
}) => {
  return (
    <div className="stats-card h-100">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="stats-content">
            <h6 className="text-uppercase mb-1 small fw-bold">
              {title}
            </h6>
            <h2 className="mb-0 fw-bold">
              {value}
            </h2>
          </div>
          <div className="stats-icon">
            {icon}
          </div>
        </div>
        
        {change !== undefined && (
          <div className="d-flex align-items-center mt-3">
            {changeType === 'positive' ? (
              <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 d-flex align-items-center border border-success border-opacity-25">
                <FaArrowUp className="me-1" size={10} />
                {Math.abs(change).toFixed(1)}%
              </span>
            ) : (
              <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2 py-1 d-flex align-items-center border border-danger border-opacity-25">
                <FaArrowDown className="me-1" size={10} />
                {Math.abs(change).toFixed(1)}%
              </span>
            )}
            <span className="text-muted small ms-2 fst-italic">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
