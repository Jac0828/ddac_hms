import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import './EditFormModal.css';

interface EditFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  maxWidth?: string;
}

const EditFormModal: React.FC<EditFormModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  maxWidth = '800px'
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="edit-form-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="edit-form-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ maxWidth }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-form-modal-header">
              <h3 className="edit-form-modal-title">{title}</h3>
              <button
                className="edit-form-modal-close"
                onClick={onClose}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="edit-form-modal-body">
              {onSubmit ? (
                <form onSubmit={onSubmit}>
                  {children}
                  <div className="edit-form-modal-actions">
                    <button
                      type="button"
                      className="edit-form-modal-btn cancel"
                      onClick={onClose}
                    >
                      {cancelText}
                    </button>
                    <button
                      type="submit"
                      className="edit-form-modal-btn submit"
                    >
                      {submitText}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {children}
                  <div className="edit-form-modal-actions">
                    <button
                      type="button"
                      className="edit-form-modal-btn cancel"
                      onClick={onClose}
                    >
                      {cancelText}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditFormModal;

