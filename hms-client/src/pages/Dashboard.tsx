import { useState, useEffect } from 'react';
import { checkHealth, getApiBaseUrl } from '../lib/api';

interface HealthResponse {
  status: string;
  timestamp: string;
}

const Dashboard = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const data = await checkHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health status');
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card">
            <div className="card-header">
              <h2>Dashboard</h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h5>API Configuration</h5>
                <p className="text-muted">
                  <strong>API Base URL:</strong> {getApiBaseUrl()}
                </p>
              </div>

              <div className="mb-4">
                <h5>Health Check</h5>
                {loading && (
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {health && !loading && (
                  <div className="alert alert-success" role="alert">
                    <strong>Status:</strong> {health.status}
                    <br />
                    <strong>Timestamp:</strong> {new Date(health.timestamp).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const data = await checkHealth();
                      setHealth(data);
                      setError(null);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  Refresh Health Check
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

