import React from 'react';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

const PlayerCard = ({ 
  player, 
  isSelected = false, 
  onAdd, 
  onRemove, 
  isDraggable = true,
  showPosition = false,
  isPlaced = false,
  compact = false,
  className = ""
}) => {
  // More robust player name extraction
  const playerName = player.fullName || player.name || player.username || 
                     (player.firstName && player.lastName ? `${player.firstName} ${player.lastName}` : '') ||
                     player.email?.split('@')[0] || 'Unknown Player';
  const playerEmail = player.email || 'No email';
  const playerId = player._id || player.id;

  const handleDragStart = (e) => {
    if (!isDraggable || isPlaced) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'player',
      player: player
    }));
    e.dataTransfer.effectAllowed = 'copy';
    e.currentTarget.classList.add('dragging');
  };
  
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
  };

  const cardClasses = `
    player-card group relative flex items-center justify-between transition-all duration-300 border w-full 
    ${compact ? 'p-2 rounded-lg min-h-[45px]' : 'p-2.5 rounded-lg min-h-[50px]'}
    ${isSelected 
      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/60 shadow-md shadow-emerald-500/20 scale-[1.01]' 
      : 'bg-gradient-to-r from-neutral-800/80 to-neutral-700/80 border-neutral-600/50 hover:border-sky-400/60 hover:shadow-sm hover:scale-[1.005]'
    }
    ${isPlaced ? 'bg-neutral-800/60 text-neutral-400 cursor-not-allowed border-neutral-700/40 opacity-70' : ''}
    ${isDraggable && !isPlaced ? 'cursor-grab hover:cursor-grab active:cursor-grabbing' : ''}
    ${className}
    backdrop-blur-sm shadow-sm border overflow-hidden
  `;

  return (
    <div 
      className={cardClasses}
      draggable={isDraggable && !isPlaced}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Animated background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
      
      <div className={`flex items-center flex-1 min-w-0 relative z-10 ${compact ? 'space-x-2' : 'space-x-2.5'}`}>
        <div className={`relative flex-shrink-0 ${compact ? 'w-9 h-9' : 'w-11 h-11'}`}>
          <div className={`overflow-hidden rounded-full border-2 ${isSelected ? 'border-emerald-400' : 'border-sky-600/50'} bg-gradient-to-r from-slate-800 to-slate-700 shadow-inner ${compact ? 'w-9 h-9' : 'w-11 h-11'}`}>
            {player.profileImage ? (
              <img 
                src={getImageUrl(player.profileImage, 'user')}
                alt={playerName} 
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, 'user', playerName)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/70 to-indigo-700/70">
                <span className={`text-white font-bold ${compact ? 'text-sm' : 'text-base'}`}>
                  {playerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Status indicator */}
          <div className={`absolute -bottom-0.5 -right-0.5 bg-emerald-400 border-2 border-neutral-800 rounded-full flex items-center justify-center shadow-sm ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`}>
            <div className={`bg-white rounded-full ${compact ? 'w-0.5 h-0.5' : 'w-1 h-1'}`}></div>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={`flex items-center space-x-2 ${compact ? 'mb-0' : 'mb-0.5'}`}>
            <h3 className={`font-bold text-white truncate group-hover:text-sky-100 transition-colors duration-300 ${compact ? 'text-xs' : 'text-sm'}`}>{playerName}</h3>
            {isSelected && !compact && (
              <span className="flex items-center space-x-1 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm ring-1 ring-emerald-400/50">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>SELECTED</span>
              </span>
            )}
            {showPosition && player.position && (
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm ring-1 ring-purple-400/50">
                {player.position}
              </span>
            )}
          </div>
          
          <p className="text-sm text-slate-300 truncate font-medium group-hover:text-slate-200 transition-colors duration-300">{playerEmail}</p>
          
          <div className="flex items-center space-x-4 text-xs">
            {(player.preferredSports || player.preferredSport) && (
              <span className="flex items-center space-x-1 text-sky-400 font-bold group-hover:text-sky-300 transition-colors duration-300">
                <div className="w-4 h-4 bg-sky-500/20 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <span>
                  {player.preferredSports 
                    ? (Array.isArray(player.preferredSports) 
                        ? player.preferredSports.slice(0, 2).join(', ')
                        : player.preferredSports)
                    : player.preferredSport}
                </span>
              </span>
            )}
            {player.position && !showPosition && (
              <span className="flex items-center space-x-1 text-amber-400 font-bold group-hover:text-amber-300 transition-colors duration-300">
                <div className="w-4 h-4 bg-amber-500/20 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <span>{player.position}</span>
              </span>
            )}
            {player.skillLevel && (
              <span className="flex items-center space-x-1 text-yellow-400 font-bold group-hover:text-yellow-300 transition-colors duration-300">
                <div className="w-4 h-4 bg-yellow-500/20 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <span>{player.skillLevel}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 flex-shrink-0 relative z-10">
        {isPlaced && (
          <span className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-500/25 px-3 py-2 rounded-xl border-2 border-emerald-500/50 shadow-lg ring-1 ring-emerald-400/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4" />
            </svg>
            <span>PLACED</span>
          </span>
        )}
        {!isPlaced && (
          <button 
            onClick={() => isSelected ? onRemove(playerId) : onAdd(player)}
            className={`group/btn flex items-center space-x-2 text-sm font-bold py-2 px-4 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95 border relative overflow-hidden ${
              isSelected 
                ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white shadow-red-500/50 border-red-400/50 ring-1 ring-red-400/30' 
                : 'bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500 hover:from-sky-600 hover:via-blue-600 hover:to-cyan-600 text-white shadow-sky-500/50 border-sky-400/50 ring-1 ring-sky-400/30'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out"></div>
            <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSelected ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              )}
            </svg>
            <span className="relative z-10">{isSelected ? 'Remove' : 'Add'}</span>
          </button>
        )}
        
        {/* Enhanced Drag indicator */}
        {isDraggable && !isPlaced && (
          <div className="flex flex-col space-y-1 text-slate-400 p-2 group-hover:text-slate-300 transition-colors duration-300">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-current rounded-full group-hover:animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-current rounded-full group-hover:animate-bounce" style={{ animationDelay: '150ms' }}></div>
            </div>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-current rounded-full group-hover:animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="w-1.5 h-1.5 bg-current rounded-full group-hover:animate-bounce" style={{ animationDelay: '450ms' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PlayerCard);
