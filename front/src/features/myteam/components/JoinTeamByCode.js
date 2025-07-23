import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../../shared/ui/components/Toast';
import '../styles/TeamAnimations.css';

const JoinTeamByCode = ({ isOpen, onClose, onSuccess }) => {
  const [secretCode, setSecretCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSegments, setCodeSegments] = useState(['', '', '', '']);
  const { error: showError } = useToast();

  // Auto-focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const firstInput = document.getElementById('code-segment-0');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle code segment changes with auto-advancing
  const handleSegmentChange = (index, value) => {
    if (value.length > 2) return; // Limit to 2 chars per segment

    const newSegments = [...codeSegments];
    newSegments[index] = value.toUpperCase();
    setCodeSegments(newSegments);
    
    // Auto-advance to next field
    if (value.length === 2 && index < 3) {
      const nextInput = document.getElementById(`code-segment-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
    
    // Update the full code
    setSecretCode(newSegments.join(''));
  };

  // Handle backspace to go to previous field
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeSegments[index] && index > 0) {
      const prevInput = document.getElementById(`code-segment-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = codeSegments.join('');
    
    if (fullCode.length !== 8) {
      setError('Please enter a complete 8-character code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5004/api/teams/join-by-code',
        { secretCode: fullCode },
        {
          headers: { 'x-auth-token': token }
        }
      );

      if (response.data.team) {
        onSuccess(response.data.team);
      }
    } catch (err) {
      console.error('Error joining team:', err);
      setError(err.response?.data?.error || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  // Handle paste event for the entire code
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleaned = pastedText.replace(/\s/g, '').toUpperCase();
    
    if (cleaned.length <= 8) {
      const newSegments = [
        cleaned.slice(0, 2),
        cleaned.slice(2, 4),
        cleaned.slice(4, 6),
        cleaned.slice(6, 8)
      ];
      setCodeSegments(newSegments);
      setSecretCode(cleaned);
      
      // Focus last field that should have content
      const lastIndex = Math.min(Math.floor(cleaned.length / 2), 3);
      const lastInput = document.getElementById(`code-segment-${lastIndex}`);
      if (lastInput) {
        lastInput.focus();
        // Move cursor to end
        const len = lastInput.value.length;
        setTimeout(() => {
          lastInput.setSelectionRange(len, len);
        }, 0);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-enter-active bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Join Private Team</h3>
            <p className="text-sm text-gray-400">Enter the 8-character team code</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-5 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-center">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-3">
              Team Code
            </label>
            <div 
              className="flex justify-center space-x-2 mb-1"
              onPaste={handlePaste}
            >
              {codeSegments.map((segment, index) => (
                <input
                  key={index}
                  id={`code-segment-${index}`}
                  type="text"
                  value={segment}
                  onChange={(e) => handleSegmentChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-16 h-16 bg-gray-700/80 text-center text-xl text-white font-mono tracking-widest rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none shadow-lg"
                  maxLength={2}
                />
              ))}
            </div>
            <p className="text-gray-400 text-sm text-center mt-3">
              Ask the team captain for the join code
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || secretCode.length !== 8}
              className="btn-pulse flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 disabled:opacity-50 flex items-center justify-center shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <span>Join Team</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinTeamByCode;
