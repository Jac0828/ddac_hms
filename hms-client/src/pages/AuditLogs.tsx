import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auditLogApi, AuditLog } from '../services/api';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import './Dashboard.css';

const AuditLogs: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!isAdmin) return;
    loadLogs();
  }, [isAdmin, page, filters]);

  const loadLogs = async () => {
    try {
      const response = await auditLogApi.getAll({
        ...filters,
        page,
        pageSize: 50,
      });
      setLogs(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      entityType: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="container mt-5">
        <h2 className="mb-4">Audit Logs</h2>

        {/* Filters */}
        <motion.div
          className="card shadow-sm mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card-body">
            <h5 className="card-title mb-3">Filters</h5>
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label">User ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  placeholder="Filter by user ID"
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Action</label>
                <input
                  type="text"
                  className="form-control"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  placeholder="Filter by action"
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Entity Type</label>
                <input
                  type="text"
                  className="form-control"
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  placeholder="Filter by entity type"
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div className="col-md-3 mb-3 d-flex align-items-end">
                <button className="btn btn-secondary" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <motion.div
              className="card shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="card-body p-0">
                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Entity Type</th>
                        <th>Entity ID</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length > 0 ? (
                        logs.map((log) => (
                          <tr key={log.id}>
                            <td>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}</td>
                            <td>
                              <div>{log.userName}</div>
                              <small className="text-muted">{log.userEmail}</small>
                            </td>
                            <td>{log.action}</td>
                            <td>{log.entityType}</td>
                            <td>{log.entityId || '-'}</td>
                            <td>{log.details || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            No audit logs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page - 1)}>
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page + 1)}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;

