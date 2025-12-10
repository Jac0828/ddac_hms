import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaQuestionCircle } from 'react-icons/fa';
import './FeedbackModal.css';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  // Prevent scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <FaCheckCircle className="modal-icon success" />;
      case 'error': return <FaExclamationCircle className="modal-icon error" />;
      case 'confirm': return <FaQuestionCircle className="modal-icon confirm" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="modal-header-icon">
              {getIcon()}
            </div>
            <h3 className="modal-title">{title}</h3>
            <p className="modal-message">{message}</p>
            
            <div className="modal-actions">
              {type === 'confirm' ? (
                <>
                  <button className="modal-btn cancel" onClick={onClose}>
                    {cancelText}
                  </button>
                  <button 
                    className="modal-btn confirm" 
                    onClick={() => {
                      if (onConfirm) onConfirm();
                      onClose();
                    }}
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button className="modal-btn primary" onClick={onClose}>
                  OK
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;

