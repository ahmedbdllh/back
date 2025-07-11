import React from 'react';
import { AuthModal } from '../../../shared/ui/components/AuthModal';

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
              <p className="text-sm font-medium text-neutral-200">
                Step {modalStep} of 3 - {
                  modalStep === 1 ? 'Team Information' :
                  modalStep === 2 ? 'Select Players' :
                  'Formation & Strategy'
                }
              </p>
              <p className="text-sm font-medium text-sky-300">{Math.round(progressPercentage)}% Complete</p>
            </div>
            <div className="w-full bg-neutral-600 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-sky-500 to-blue-500 h-2 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
            </div>
            
            {/* Step indicators */}
            <div className="flex justify-between mt-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center space-y-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                    step <= modalStep 
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
                      : 'bg-neutral-600 text-neutral-400'
                  }`}>
                    {step < modalStep ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  <span className={`text-xs transition-colors duration-300 ${
                    step <= modalStep ? 'text-sky-300' : 'text-neutral-500'
                  }`}>
                    {step === 1 ? 'Info' : step === 2 ? 'Players' : 'Formation'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer with buttons */}
        <div className="p-4 bg-gradient-to-r from-neutral-900 to-neutral-800 flex justify-between items-center flex-shrink-0 border-t border-neutral-700">
          <button 
            onClick={onBackStep} 
            disabled={modalStep === 1} 
            className="bg-transparent border border-neutral-600 hover:bg-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {modalStep > 1 && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
            <span>{modalStep === 1 ? 'Cancel' : 'Back'}</span>
          </button>
          
          {modalStep < 3 ? (
            <button 
              onClick={onNextStep} 
              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-sky-500/30 transform hover:scale-105"
            >
              <span>Next Step</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={onCreateTeam} 
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/30 transform hover:scale-105 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Team</span>
            </button>
          )}
        </div>
      </div>
    </AuthModal>
  );
};

export default MyTeamModal;
