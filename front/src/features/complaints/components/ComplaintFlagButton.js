import React, { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import ComplaintFormModal from './ComplaintFormModal';

const ComplaintFlagButton = ({ 
  relatedTo, // { type: 'court', referenceId: 'courtId', referenceName: 'Court Name' }
  className = '',
  variant = 'icon', // 'icon', 'button', 'text'
  size = 'md' // 'sm', 'md', 'lg'
}) => {
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  const handleFlagClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling if used inside clickable cards
    setShowComplaintModal(true);
  };

  const handleComplaintSubmitted = () => {
    // You can add success notification here
    console.log('Complaint submitted successfully');
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3'
    };
    return sizes[size] || sizes.md;
  };

  const getIconSize = () => {
    const iconSizes = {
      sm: 14,
      md: 16,
      lg: 20
    };
    return iconSizes[size] || iconSizes.md;
  };

  const renderButton = () => {
    const baseClasses = `
      transition-colors duration-200 rounded-lg
      hover:bg-red-500/10 hover:text-red-400
      text-gray-400 border border-transparent
      hover:border-red-500/30
    `;

    switch (variant) {
      case 'button':
        return (
          <button
            onClick={handleFlagClick}
            className={`${baseClasses} ${getSizeClasses()} flex items-center space-x-2 ${className}`}
            title="Report an issue"
          >
            <Flag size={getIconSize()} />
            <span className="text-sm font-medium">Report Issue</span>
          </button>
        );

      case 'text':
        return (
          <button
            onClick={handleFlagClick}
            className={`${baseClasses} px-3 py-1 flex items-center space-x-1 text-sm ${className}`}
            title="Report an issue"
          >
            <AlertTriangle size={getIconSize()} />
            <span>Report Problem</span>
          </button>
        );

      case 'icon':
      default:
        return (
          <button
            onClick={handleFlagClick}
            className={`${baseClasses} ${getSizeClasses()} ${className}`}
            title="Report an issue with this item"
          >
            <Flag size={getIconSize()} />
          </button>
        );
    }
  };

  return (
    <>
      {renderButton()}
      
      <ComplaintFormModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        onSuccess={handleComplaintSubmitted}
        relatedTo={relatedTo}
        prefilledCategory={relatedTo?.type || 'other'}
      />
    </>
  );
};

export default ComplaintFlagButton;
