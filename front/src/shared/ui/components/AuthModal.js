import React from 'react';

export const AuthModal = ({ isOpen, onClose, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto p-4"
      onClick={handleBackdropClick}
    >
      <div className={`relative bg-card text-card-foreground rounded-lg shadow-2xl border border-border w-full ${maxWidth} mx-auto my-4 max-h-[95vh] flex flex-col`}>
        {/* Scrollable container for the modal content */}
        <div className="overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};