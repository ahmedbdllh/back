import React from 'react';
import { AuthModal } from '../../shared/ui/components/AuthModal';

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M19 3v4M17 5h4M14 11l-1.5-1.5L11 11l-1.5 1.5L11 14l1.5-1.5L14 14l1.5 1.5L17 14l-1.5-1.5L17 11l-1.5-1.5-1.5 1.5z" />
  </svg>
);

const MyTeamModal = ({ 
  isOpen, 
  onClose, 
  modalStep, 
  onNextStep, 
  onBackStep, 
  onCreateTeam,
  children 
}) => {
  const progressPercentage = (modalStep / 3) * 100;

  return (
    <AuthModal 
      isOpen={isOpen} 
      onClose={onClose} 
      maxWidth={modalStep === 3 ? "max-w-6xl" : "max-w-lg"}
    >
      <div className="text-white rounded-lg shadow-2xl bg-neutral-800 flex flex-col min-h-0 max-h-none overflow-visible">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-neutral-800 via-neutral-700 to-sky-600 p-6 relative flex-shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors text-2xl font-light"
          >
            ×
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2">
              <SparklesIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Your Team</h2>
              <p className="text-sm text-neutral-200">Let's build something amazing together</p>
            </div>
          </div>
          
          {/* Progress section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-neutral-200">Step {modalStep} of 3</p>
              <p className="text-sm font-medium text-sky-300">{Math.round(progressPercentage)}% Complete</p>
            </div>
            <div className="w-full bg-neutral-600 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-sky-500 to-sky-400 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer with buttons */}
        <div className="p-4 bg-neutral-900 flex justify-between items-center flex-shrink-0 border-t border-neutral-700">
          <button 
            onClick={onBackStep} 
            disabled={modalStep === 1} 
            className="bg-transparent border border-neutral-600 hover:bg-neutral-700 text-neutral-300 hover:text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {modalStep === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {modalStep < 3 ? (
            <button 
              onClick={onNextStep} 
              className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-sky-500/20"
            >
              <span>Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={onCreateTeam} 
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/20"
            >
              Create Team
            </button>
          )}
        </div>
      </div>
    </AuthModal>
  );
};

export default MyTeamModal;
