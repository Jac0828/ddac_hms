import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { housekeepingApi, HousekeepingTask } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBroom, FaCheck, FaExclamationTriangle, FaSpinner, FaClock } from 'react-icons/fa';
import './Admin.css'; // Use Admin styles for consistency
import LoadingSpinner from '../components/common/LoadingSpinner';
import FeedbackModal, { FeedbackModalProps } from '../components/common/FeedbackModal';

const HousekeepingDashboard: React.FC = () => {
  const { isHousekeeping, user } = useAuth();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'inprogress' | 'completed'>('all');
  
  // Modal state
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalProps>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false })),
  });

  useEffect(() => {
    if (!isHousekeeping) {
      return;
    }
    loadTasks();
  }, [isHousekeeping]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await housekeepingApi.getAll();
      // Sort: Pending first, then InProgress, then Completed
      const sortedData = data.sort((a, b) => {
        const statusOrder = { 'Pending': 1, 'InProgress': 2, 'Completed': 3 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 4) - (statusOrder[b.status as keyof typeof statusOrder] || 4);
      });
      setTasks(sortedData);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      showError('Error', 'Failed to load housekeeping tasks');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (title: string, message: string) => {
    setFeedbackModal({
      isOpen: true,
      type: 'success',
      title,
      message,
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showError = (title: string, message: string) => {
    setFeedbackModal({
      isOpen: true,
      type: 'error',
      title,
      message,
      onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      await housekeepingApi.updateStatus(taskId, status);
      showSuccess('Success', `Task status updated to ${status}`);
      loadTasks();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Failed to update task status');
    }
  };

  if (!isHousekeeping) {
    return null;
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    // Normalize status comparison
    return task.status.toLowerCase().replace(' ', '') === filter;
  });

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', position: 'relative', padding: '2rem 0' }}>
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={feedbackModal.onClose}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onConfirm={feedbackModal.onConfirm}
        confirmText={feedbackModal.confirmText}
        cancelText={feedbackModal.cancelText}
      />

      <div className="container">
        <div className="mb-5">
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C', marginBottom: '0.5rem' }}>Housekeeping</h2>
          <p className="text-muted mb-0">Welcome, {user?.firstName}</p>
        </div>

        {/* Filter Tabs */}
        <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('all')}
            style={filter === 'all' ? { background: '#8B6F47', borderColor: '#8B6F47' } : {}}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
            onClick={() => setFilter('pending')}
          >
            To Do ({tasks.filter(t => t.status === 'Pending').length})
          </button>
          <button
            className={`btn ${filter === 'inprogress' ? 'btn-info' : 'btn-outline-info'}`}
            onClick={() => setFilter('inprogress')}
          >
            In Progress ({tasks.filter(t => t.status === 'InProgress').length})
          </button>
          <button
            className={`btn ${filter === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({tasks.filter(t => t.status === 'Completed').length})
          </button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading Tasks..." />
        ) : (
          <div className="row g-4">
            {filteredTasks.length === 0 ? (
              <div className="col-12 text-center py-5">
                <div className="text-muted" style={{ fontSize: '4rem', opacity: 0.3 }}><FaBroom /></div>
                <p className="text-muted mt-3">No tasks found for this filter.</p>
              </div>
            ) : (
              filteredTasks.map((task, index) => (
                <div className="col-md-6 col-lg-4" key={task.id}>
                  <motion.div
                    className="card shadow-sm h-100 border-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.85)' }}
                  >
                    <div className={`card-header border-0 py-3 d-flex justify-content-between align-items-center ${
                      task.status === 'Pending' ? 'bg-warning-subtle text-warning-emphasis' :
                      task.status === 'InProgress' ? 'bg-info-subtle text-info-emphasis' :
                      'bg-success-subtle text-success-emphasis'
                    }`}>
                      <h5 className="mb-0 fw-bold">Room {task.roomNumber}</h5>
                      <div className="d-flex align-items-center gap-2">
                        {task.status === 'Pending' && <FaExclamationTriangle />}
                        {task.status === 'InProgress' && <FaSpinner className="spin" />}
                        {task.status === 'Completed' && <FaCheck />}
                        <span className="small fw-bold">{task.status}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <p className="text-muted small mb-3">
                        <FaClock className="me-1" /> Created: {new Date(task.createdAt).toLocaleString()}
                      </p>
                      {task.notes && (
                        <div className="alert alert-light border mb-3">
                          <small className="text-muted d-block fw-bold">Notes:</small>
                          {task.notes}
                        </div>
                      )}
                      
                      <div className="d-grid gap-2">
                        {task.status === 'Pending' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => updateTaskStatus(task.id, 'InProgress')}
                            style={{ background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', border: 'none' }}
                          >
                            Start Cleaning
                          </button>
                        )}
                        {task.status === 'InProgress' && (
                          <button
                            className="btn btn-success"
                            onClick={() => updateTaskStatus(task.id, 'Completed')}
                          >
                            Mark as Clean
                          </button>
                        )}
                        {task.status === 'Completed' && (
                          <button className="btn btn-outline-secondary" disabled>
                            Cleaning Finished
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HousekeepingDashboard;
