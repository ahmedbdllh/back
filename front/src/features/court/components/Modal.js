import React from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 500 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0C1D35 0%, #1E293B 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500/20 to-lime-600/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-teal-500/20 to-sky-400/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          </div>
            {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
            <h2 className="text-lg sm:text-2xl font-bold text-white pr-2">{title}</h2>
            <motion.button 
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X size={18} className="sm:hidden" />
              <X size={20} className="hidden sm:block" />
            </motion.button>
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
