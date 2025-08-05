import React from 'react';
import Avatar from '../../components/Avatar';

const PlayerCard = ({ 
  player, 
  isSelected = false, 
  onAdd, 
  onRemove, 
  isDraggable = true,
  showPosition = false,
  isPlaced = false,
  className = ""
}) => {
  const playerName = player.fullName || player.name || 'Unknown Player';
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
    player-card flex justify-between items-center rounded-lg p-3 transition-all duration-200
    ${isSelected ? 'bg-sky-500/20 border border-sky-500/50' : 'bg-neutral-700 hover:bg-neutral-600'}
    ${isPlaced ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : ''}
    ${isDraggable && !isPlaced ? 'draggable-player cursor-grab' : ''}
    ${className}
  `;

  return (
    <div 
      className={cardClasses}
      style={{ minHeight: '76px' }}
      draggable={isDraggable && !isPlaced}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center space-x-3">
        <div className="relative w-10 h-10 flex-shrink-0">
          {player.profileImage && player.profileImage.startsWith('http') ? (
            <img 
              src={player.profileImage}
              alt={playerName} 
              className="w-full h-full rounded-full border-2 border-sky-400 object-cover"
              style={{ 
                backgroundColor: '#404040',
                minWidth: '40px', 
                minHeight: '40px'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                const avatarFallback = e.target.nextElementSibling;
                if (avatarFallback) {
                  avatarFallback.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <Avatar 
            name={playerName}
            size={40}
            className="border-2 border-sky-400"
            style={{ 
              display: player.profileImage && player.profileImage.startsWith('http') ? 'none' : 'flex'
            }}
          />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">{playerName}</p>
            {showPosition && player.position && (
              <span className="text-xs bg-sky-500/50 text-sky-300 px-2 py-0.5 rounded-full font-mono">
                {player.position}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400">{playerEmail}</p>
          {(player.preferredSports || player.preferredSport) && (
            <p className="text-sky-400 text-xs">
              {player.preferredSports 
                ? (Array.isArray(player.preferredSports) 
                    ? player.preferredSports.join(', ') 
                    : player.preferredSports)
                : player.preferredSport}
            </p>
          )}
          {player.position && !showPosition && (
            <p className="text-green-400 text-xs">Position: {player.position}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {isPlaced && (
          <span className="text-xs font-bold text-green-400">PLACED</span>
        )}
        {!isPlaced && (
          <button 
            onClick={() => isSelected ? onRemove(playerId) : onAdd(player)}
            className={`text-xs font-bold py-1 px-3 rounded-lg transition-colors duration-200 ${
              isSelected 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-sky-500 hover:bg-sky-600 text-white'
            }`}
          >
            {isSelected ? 'Remove' : 'Add'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
