import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { housekeepingApi, HousekeepingTask, serviceRequestsApi, ServiceRequest } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBroom, FaCheck, FaExclamationTriangle, FaSpinner, FaClock, FaConciergeBell, FaUser, FaBed } from 'react-icons/fa';
import './Admin.css'; // Use Admin styles for consistency
import LoadingSpinner from '../components/common/LoadingSpinner';
import FeedbackModal, { FeedbackModalProps } from '../components/common/FeedbackModal';

const HousekeepingDashboard: React.FC = () => {
  const { isHousekeeping, user } = useAuth();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cleaning' | 'requests'>('requests');
  const [filter, setFilter] = useState<'all' | 'pending' | 'inprogress' | 'completed'>('all');
  const prevRequestsRef = useRef<ServiceRequest[]>([]);
  
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
    loadData();

    // Poll for new requests every 30 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [isHousekeeping]);

  const loadData = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const [tasksData, requestsData] = await Promise.all([
        user?.id ? housekeepingApi.getByStaff(user.id) : Promise.resolve([]),
        serviceRequestsApi.getAll()
      ]);

      // Sort Tasks
      const sortedTasks = tasksData.sort((a, b) => {
        const statusOrder = { 'Pending': 1, 'InProgress': 2, 'Completed': 3 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 4) - (statusOrder[b.status as keyof typeof statusOrder] || 4);
      });
      setTasks(sortedTasks);

      // Filter Requests: show requests assigned to me OR unassigned pending requests
      // This allows housekeepers to see and pick up unassigned requests
      const myRequests = requestsData.filter(r => 
        r.assignedToUserId === user?.id || // Assigned to me
        (r.assignedToUserId === null || r.assignedToUserId === undefined) // Unassigned (can pick up)
      );

      // Check for new assignments to trigger popup
      if (isPolling && prevRequestsRef.current.length > 0) {
        const newAssignments = myRequests.filter(req => 
          !prevRequestsRef.current.find(prev => prev.id === req.id) &&
          req.status !== 'Completed' && req.status !== 'Cancelled'
        );

        if (newAssignments.length > 0) {
          setFeedbackModal({
            isOpen: true,
            type: 'info',
            title: 'New Assignment',
            message: `You have ${newAssignments.length} new service request(s) assigned.`,
            onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
          });
        }
      }

      setRequests(myRequests);
      prevRequestsRef.current = myRequests;

    } catch (err) {
      console.error('Failed to load data:', err);
      if (!isPolling) showError('Error', 'Failed to load dashboard data');
    } finally {
      if (!isPolling) setLoading(false);
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
      loadData(); // Reload to refresh
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Failed to update task status');
    }
  };

  const updateRequestStatus = async (requestId: number, status: string) => {
    try {
      await serviceRequestsApi.updateStatus(requestId, status);
      showSuccess('Success', `Request marked as ${status}`);
      loadData();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Failed to update request status');
    }
  };

  if (!isHousekeeping) {
    return null;
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status.toLowerCase().replace(' ', '') === filter;
  });

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status.toLowerCase() === filter;
  });

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', position: 'relative', padding: '2rem 0', background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 100%)' }}>
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
        {/* Dashboard Tabs and Filters Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            border: '2px solid #C9A961',
            borderRadius: '24px',
            padding: '2.5rem',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(253, 251, 247, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 15px 40px rgba(201, 169, 97, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #C9A961 0%, #8B6F47 50%, #C9A961 100%)',
            opacity: 0.6
          }}></div>
          {/* Dashboard Tabs */}
          <div className="d-flex justify-content-center mb-4">
            <div className="btn-group shadow-lg" role="group" style={{ 
              borderRadius: '50px', 
              overflow: 'hidden', 
              border: '2px solid rgba(201, 169, 97, 0.3)',
              boxShadow: '0 4px 15px rgba(201, 169, 97, 0.2)'
            }}>
              <button
                type="button"
                className="btn px-4 py-3 fw-bold"
                style={{ 
                  background: activeTab === 'requests' 
                    ? 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)' 
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)',
                  color: activeTab === 'requests' ? 'white' : '#8B6F47',
                  border: 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'visible'
                }}
                onClick={() => setActiveTab('requests')}
                onMouseEnter={(e) => {
                  if (activeTab !== 'requests') {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201, 169, 97, 0.15) 0%, rgba(139, 111, 71, 0.15) 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'requests') {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)';
                  }
                }}
              >
                <FaConciergeBell className="me-2" style={{ fontSize: '1.1rem' }} /> Guest Requests
                {requests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length > 0 && (
                  <span className="badge ms-2 rounded-pill" style={{
                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    color: 'white',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    boxShadow: '0 2px 6px rgba(220, 53, 69, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    {requests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="btn px-4 py-3 fw-bold"
                style={{ 
                  background: activeTab === 'cleaning' 
                    ? 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)' 
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)',
                  color: activeTab === 'cleaning' ? 'white' : '#8B6F47',
                  border: 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'visible'
                }}
                onClick={() => setActiveTab('cleaning')}
                onMouseEnter={(e) => {
                  if (activeTab !== 'cleaning') {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201, 169, 97, 0.15) 0%, rgba(139, 111, 71, 0.15) 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'cleaning') {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)';
                  }
                }}
              >
                <FaBroom className="me-2" style={{ fontSize: '1.1rem' }} /> Cleaning Tasks
                {tasks.filter(t => t.status === 'Pending').length > 0 && (
                  <span className="badge ms-2 rounded-pill" style={{
                    background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
                    color: '#856404',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    boxShadow: '0 2px 6px rgba(255, 193, 7, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    {tasks.filter(t => t.status === 'Pending').length}
                  </span>
                )}
              </button>
            </div>
        </div>

          {/* Status Filters */}
          <div className="d-flex gap-2 overflow-auto pb-2 justify-content-center flex-wrap">
          <button
              className="btn rounded-pill px-4 py-2 fw-bold"
            onClick={() => setFilter('all')}
              style={filter === 'all' 
                ? { 
                    background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', 
                    borderColor: '#C9A961', 
                    borderWidth: '2px',
                    color: 'white', 
                    boxShadow: '0 4px 12px rgba(201, 169, 97, 0.4)',
                    transform: 'scale(1.05)',
                    transition: 'all 0.3s ease'
                  }
                : { 
                    color: '#8B6F47', 
                    borderColor: '#C9A961', 
                    borderWidth: '2px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)',
                    transition: 'all 0.3s ease'
                  }
              }
              onMouseEnter={(e) => {
                if (filter !== 'all') {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201, 169, 97, 0.1) 0%, rgba(139, 111, 71, 0.1) 100%)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== 'all') {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              All
          </button>
          <button
              className="btn rounded-pill px-4 py-2 fw-bold"
            onClick={() => setFilter('pending')}
              style={filter === 'pending'
                ? { 
                    background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)', 
                    borderColor: '#FFC107', 
                    borderWidth: '2px',
                    color: 'white', 
                    boxShadow: '0 4px 12px rgba(255, 193, 7, 0.4)',
                    transform: 'scale(1.05)',
                    transition: 'all 0.3s ease'
                  }
                : { 
                    color: '#FF9800', 
                    borderColor: '#FFC107', 
                    borderWidth: '2px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)',
                    transition: 'all 0.3s ease'
                  }
              }
              onMouseEnter={(e) => {
                if (filter !== 'pending') {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== 'pending') {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              Pending
          </button>
          <button
              className="btn rounded-pill px-4 py-2 fw-bold"
            onClick={() => setFilter('inprogress')}
              style={filter === 'inprogress'
                ? { 
                    background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)', 
                    borderColor: '#17a2b8', 
                    borderWidth: '2px',
                    color: 'white', 
                    boxShadow: '0 4px 12px rgba(23, 162, 184, 0.4)',
                    transform: 'scale(1.05)',
                    transition: 'all 0.3s ease'
                  }
                : { 
                    color: '#138496', 
                    borderColor: '#17a2b8', 
                    borderWidth: '2px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)',
                    transition: 'all 0.3s ease'
                  }
              }
              onMouseEnter={(e) => {
                if (filter !== 'inprogress') {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 162, 184, 0.1) 0%, rgba(18, 132, 150, 0.1) 100%)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== 'inprogress') {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              In Progress
          </button>
          <button
              className="btn rounded-pill px-4 py-2 fw-bold"
            onClick={() => setFilter('completed')}
              style={filter === 'completed'
                ? { 
                    background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)', 
                    borderColor: '#28a745', 
                    borderWidth: '2px',
                    color: 'white', 
                    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.4)',
                    transform: 'scale(1.05)',
                    transition: 'all 0.3s ease'
                  }
                : { 
                    color: '#1e7e34', 
                    borderColor: '#28a745', 
                    borderWidth: '2px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)',
                    transition: 'all 0.3s ease'
                  }
              }
              onMouseEnter={(e) => {
                if (filter !== 'completed') {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(30, 126, 52, 0.1) 100%)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== 'completed') {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 251, 247, 0.9) 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              Completed
          </button>
        </div>
        </motion.div>

        {loading ? (
          <LoadingSpinner text="Loading Tasks..." />
        ) : (
          <div className="row g-4">
            {activeTab === 'requests' ? (
              // SERVICE REQUESTS VIEW
              filteredRequests.length === 0 ? (
              <div className="col-12 text-center py-5">
                  <div className="text-muted" style={{ fontSize: '4rem', opacity: 0.3, color: '#C9A961' }}><FaConciergeBell /></div>
                  <p className="text-muted mt-3">No service requests found.</p>
                </div>
              ) : (
                filteredRequests.map((req, index) => (
                  <div className="col-md-6 col-lg-4" key={req.id}>
                    <motion.div
                      className="card shadow-lg h-100 border-0"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{ 
                        borderRadius: '16px', 
                        overflow: 'hidden', 
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(253, 251, 247, 0.95) 100%)', 
                        border: '1px solid rgba(201, 169, 97, 0.3)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                      }}
                    >
                      <div className={`card-header border-0 py-3 d-flex justify-content-between align-items-center`} style={{ 
                        background: req.status === 'Completed'
                          ? 'linear-gradient(135deg, rgba(40, 167, 69, 0.15) 0%, rgba(30, 126, 52, 0.15) 100%)'
                          : req.status === 'InProgress'
                          ? 'linear-gradient(135deg, rgba(23, 162, 184, 0.15) 0%, rgba(18, 132, 150, 0.15) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%)',
                        borderBottom: req.status === 'Completed'
                          ? '2px solid rgba(40, 167, 69, 0.3)'
                          : req.status === 'InProgress'
                          ? '2px solid rgba(23, 162, 184, 0.3)'
                          : '2px solid rgba(255, 193, 7, 0.3)'
                      }}>
                        <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C' }}>
                          {req.serviceType}
                        </h5>
                        <span className={`badge rounded-pill text-uppercase fw-bold`} style={{ 
                          fontSize: '0.7rem', 
                          background: req.status === 'Completed'
                            ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)'
                            : req.status === 'InProgress'
                            ? 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)'
                            : 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                        }}>
                          {req.status}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3 text-muted">
                          <FaBed className="me-2" style={{ color: '#C9A961' }} />
                          <span className="fw-bold me-1">Room:</span> {req.booking?.room?.roomNumber || 'N/A'}
                        </div>
                        <div className="d-flex align-items-center mb-3 text-muted">
                          <FaUser className="me-2" style={{ color: '#C9A961' }} />
                          <span className="fw-bold me-1">Guest:</span> {req.user?.firstName} {req.user?.lastName}
                        </div>
                        
                        <div className="p-3 rounded mb-3" style={{ 
                          background: 'linear-gradient(135deg, rgba(253, 251, 247, 0.8) 0%, rgba(245, 240, 232, 0.6) 100%)', 
                          border: '1px solid rgba(201, 169, 97, 0.2)',
                          borderRadius: '12px'
                        }}>
                          <p className="mb-0 fst-italic text-dark small">"{req.description}"</p>
                        </div>

                        <p className="text-muted small mb-3 text-end">
                          <FaClock className="me-1" /> {new Date(req.requestedAt).toLocaleString()}
                        </p>
                        
                        <div className="d-grid gap-2">
                          {req.status !== 'Completed' && req.status !== 'Cancelled' && (
                            <button
                              className="btn fw-bold"
                              onClick={() => updateRequestStatus(req.id, 'Completed')}
                              style={{ 
                                background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', 
                                border: 'none', 
                                color: 'white',
                                boxShadow: '0 4px 10px rgba(201, 169, 97, 0.3)',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 15px rgba(201, 169, 97, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(201, 169, 97, 0.3)';
                              }}
                            >
                              <FaCheck className="me-2" /> Mark Complete
                            </button>
                          )}
                          {req.status === 'Completed' && (
                            <button 
                              className="btn fw-bold" 
                              disabled
                              style={{
                                background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(30, 126, 52, 0.1) 100%)',
                                border: '1px solid rgba(40, 167, 69, 0.3)',
                                color: '#28a745',
                                cursor: 'not-allowed',
                                opacity: 0.8
                              }}
                            >
                              <FaCheck className="me-2" /> Completed
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))
              )
            ) : (
              // CLEANING TASKS VIEW
              filteredTasks.length === 0 ? (
                <div className="col-12 text-center py-5">
                  <div className="text-muted" style={{ fontSize: '4rem', opacity: 0.3, color: '#C9A961' }}><FaBroom /></div>
                  <p className="text-muted mt-3">No cleaning tasks found.</p>
              </div>
            ) : (
              filteredTasks.map((task, index) => (
                <div className="col-md-6 col-lg-4" key={task.id}>
                  <motion.div
                      className="card shadow-lg h-100 border-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                      style={{ 
                        borderRadius: '16px', 
                        overflow: 'hidden', 
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(253, 251, 247, 0.95) 100%)', 
                        border: '1px solid rgba(201, 169, 97, 0.3)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                      }}
                    >
                      <div className={`card-header border-0 py-3 d-flex justify-content-between align-items-center`} style={{ 
                        background: task.status === 'Pending' 
                          ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%)'
                          : task.status === 'InProgress'
                          ? 'linear-gradient(135deg, rgba(23, 162, 184, 0.15) 0%, rgba(18, 132, 150, 0.15) 100%)'
                          : 'linear-gradient(135deg, rgba(40, 167, 69, 0.15) 0%, rgba(30, 126, 52, 0.15) 100%)',
                        borderBottom: task.status === 'Pending'
                          ? '2px solid rgba(255, 193, 7, 0.3)'
                          : task.status === 'InProgress'
                          ? '2px solid rgba(23, 162, 184, 0.3)'
                          : '2px solid rgba(40, 167, 69, 0.3)'
                      }}>
                        <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2C2C' }}>Room {task.roomNumber}</h5>
                      <div className="d-flex align-items-center gap-2">
                          {task.status === 'Pending' && <FaExclamationTriangle style={{ color: '#FF9800', fontSize: '1.1rem' }} />}
                          {task.status === 'InProgress' && <FaSpinner className="spin" style={{ color: '#17a2b8', fontSize: '1.1rem' }} />}
                          {task.status === 'Completed' && <FaCheck style={{ color: '#28a745', fontSize: '1.1rem' }} />}
                          <span className="small fw-bold text-uppercase" style={{ 
                            fontSize: '0.75rem', 
                            letterSpacing: '1px',
                            color: task.status === 'Pending' ? '#FF9800' : task.status === 'InProgress' ? '#17a2b8' : '#28a745',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            background: task.status === 'Pending'
                              ? 'rgba(255, 193, 7, 0.1)'
                              : task.status === 'InProgress'
                              ? 'rgba(23, 162, 184, 0.1)'
                              : 'rgba(40, 167, 69, 0.1)'
                          }}>{task.status}</span>
                        </div>
                    </div>
                    <div className="card-body">
                      <p className="text-muted small mb-3">
                        <FaClock className="me-1" /> Created: {new Date(task.createdAt).toLocaleString()}
                      </p>
                      {task.notes && (
                          <div className="alert mb-3" style={{
                            background: 'linear-gradient(135deg, rgba(253, 251, 247, 0.8) 0%, rgba(245, 240, 232, 0.6) 100%)',
                            border: '1px solid rgba(201, 169, 97, 0.2)',
                            borderRadius: '12px',
                            padding: '1rem'
                          }}>
                            <small className="d-block fw-bold mb-2" style={{ color: '#8B6F47' }}>Notes:</small>
                            <p className="mb-0" style={{ color: '#2C2C2C' }}>{task.notes}</p>
                        </div>
                      )}
                      
                      <div className="d-grid gap-2">
                        {task.status === 'Pending' && (
                          <button
                              className="btn fw-bold"
                            onClick={() => updateTaskStatus(task.id, 'InProgress')}
                              style={{ 
                                background: 'linear-gradient(135deg, #C9A961 0%, #8B6F47 100%)', 
                                border: 'none', 
                                color: 'white',
                                boxShadow: '0 4px 10px rgba(201, 169, 97, 0.3)',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 15px rgba(201, 169, 97, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(201, 169, 97, 0.3)';
                              }}
                          >
                            Start Cleaning
                          </button>
                        )}
                        {task.status === 'InProgress' && (
                          <button
                              className="btn fw-bold"
                            onClick={() => updateTaskStatus(task.id, 'Completed')}
                              style={{ 
                                background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)', 
                                border: 'none', 
                                color: 'white',
                                boxShadow: '0 4px 10px rgba(40, 167, 69, 0.3)',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 15px rgba(40, 167, 69, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(40, 167, 69, 0.3)';
                              }}
                          >
                            Mark as Clean
                          </button>
                        )}
                        {task.status === 'Completed' && (
                            <button 
                              className="btn fw-bold" 
                              disabled
                              style={{
                                background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(30, 126, 52, 0.1) 100%)',
                                border: '1px solid rgba(40, 167, 69, 0.3)',
                                color: '#28a745',
                                cursor: 'not-allowed',
                                opacity: 0.8
                              }}
                            >
                            Cleaning Finished
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HousekeepingDashboard;
