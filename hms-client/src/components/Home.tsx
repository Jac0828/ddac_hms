import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      <div className="hero-section text-center py-5 bg-light">
        <h1 className="display-4">Welcome to Hotel Management System</h1>
        <p className="lead">Your one-stop solution for hotel bookings and management</p>
        {isAuthenticated && user && (
          <p className="text-muted">Welcome back, {user.firstName}!</p>
        )}
      </div>

      <div className="container mt-5">
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">View Rooms</h5>
                <p className="card-text">Browse available rooms and check their amenities.</p>
                <Link to="/rooms" className="btn btn-primary">
                  Browse Rooms
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Check Availability</h5>
                <p className="card-text">Find available rooms for your desired dates.</p>
                <Link to="/check-availability" className="btn btn-primary">
                  Check Availability
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">
                  {isAuthenticated ? 'My Bookings' : 'Login'}
                </h5>
                <p className="card-text">
                  {isAuthenticated
                    ? 'View and manage your bookings.'
                    : 'Sign in to manage your bookings.'}
                </p>
                {isAuthenticated ? (
                  <Link to="/bookings" className="btn btn-primary">
                    My Bookings
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-primary">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

