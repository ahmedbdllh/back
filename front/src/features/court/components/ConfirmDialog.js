import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning" // warning, danger, info
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-500/20 border-red-500/30',
          button: 'bg-red-500 hover:bg-red-600',
          icon: 'text-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/20 border-yellow-500/30',
          button: 'bg-yellow-500 hover:bg-yellow-600',
          icon: 'text-yellow-400'
        };
      case 'info':
        return {
          bg: 'bg-blue-500/20 border-blue-500/30',
          button: 'bg-blue-500 hover:bg-blue-600',
          icon: 'text-blue-400'
        };
      default:
        return {
          bg: 'bg-yellow-500/20 border-yellow-500/30',
          button: 'bg-yellow-500 hover:bg-yellow-600',
          icon: 'text-yellow-400'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Dialog */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-md p-6 ${styles.bg} border backdrop-blur-sm rounded-2xl shadow-xl`}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              {/* Content */}
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${styles.icon}`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {title}
                  </h3>
                  <p className="text-white/70 mb-6">
                    {message}
                  </p>
                  
                  {/* Action buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={() => {
                        onConfirm();
                        onClose();
                      }}
                      className={`px-4 py-2 ${styles.button} text-white font-medium rounded-lg transition-colors`}
                    >
                      {confirmText}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
