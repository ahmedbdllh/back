import React from 'react';
import '../styles/TeamAnimations.css';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

const EmptyTeamState = ({ user, onCreateClick, onJoinClick }) => {
  // Get user's first name or username to display
  const getDisplayName = () => {
    if (!user) return 'Player';
    
    if (user.name) {
      // Use first name if available
      const firstName = user.name.split(' ')[0];
      return firstName;
    }
    
    // Fallback to email username portion
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'Player';
  };
  
  return (
    <div className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center shadow-lg">
      <div className="flex flex-col items-center max-w-2xl mx-auto">
        <div className="w-24 h-24 mb-6 flex items-center justify-center">
          <svg className="w-full h-full text-blue-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">No Teams Yet, {getDisplayName()}</h3>
        <p className="text-gray-400 mb-3 max-w-md">You're not currently part of any team. Ready to get in the game?</p>
        <p className="text-blue-400 mb-8 text-sm font-medium">Create your own team as captain or join an existing one with a team code</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="create-team-card bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 flex flex-col items-center text-center group shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600/30 to-blue-500/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Create a Team</h4>
            <p className="text-gray-400 mb-5">Start your own team and invite others to join. Be the captain and lead your team to victory.</p>
            <button 
              onClick={onCreateClick} 
              className="btn-pulse w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg group-hover:shadow-blue-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Team
            </button>
          </div>
          
          <div className="join-team-card bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 flex flex-col items-center text-center group shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600/30 to-indigo-500/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Join a Team</h4>
            <p className="text-gray-400 mb-5">Enter a team code to join an existing team. Connect with friends and play together.</p>
            <button 
              onClick={onJoinClick} 
              className="btn-pulse w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium rounded-lg hover:from-indigo-500 hover:to-indigo-400 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg group-hover:shadow-indigo-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Join with Code
            </button>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300 max-w-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              Teams let you play matches together, track stats and compete with other teams. 
              Join the community and start playing today!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyTeamState;
