import React from 'react';

const SimpleField = ({ 
  selectedPlayers = [], 
  playerPositions = {}, 
  onPlayerPositionChange,
  onClearPositions,
  selectedPlayer,
  onPlayerSelect,
  onPlayerAdd,
  readOnly = false
}) => {
  console.log('SimpleField - Props:', { 
    selectedPlayersLength: selectedPlayers.length, 
    playerPositionsKeys: Object.keys(playerPositions),
    hasOnPlayerPositionChange: !!onPlayerPositionChange
  });

  // Handle drop on field
  const handleDrop = (e) => {
    if (readOnly) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'player' && data.player) {
        console.log('Dropping player at:', { x, y }, data.player);
        if (onPlayerPositionChange) {
          onPlayerPositionChange(data.player._id || data.player.id, {
            x: Math.round(x),
            y: Math.round(y),
            position: 'Player', // Default position
            isStarter: true
          });
        }
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  };

  const handleDragOver = (e) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div className="w-full h-96 relative">
      <div 
        className="w-full h-full bg-gradient-to-b from-green-400 to-green-600 rounded-lg relative overflow-hidden border-2 border-white"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '10% 10%'
        }}
      >
        {/* Field markings */}
        <div className="absolute inset-2 border-2 border-white rounded-lg">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
          
          {/* Goal areas - bottom goal (home team) and top goal (away team) */}
          <div className="absolute bottom-0 left-1/4 w-1/2 h-8 border-2 border-white border-b-0"></div>
          <div className="absolute top-0 left-1/4 w-1/2 h-8 border-2 border-white border-t-0"></div>
          
          {/* Center line */}
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white"></div>
        </div>
        
        {/* Render positioned players */}
        {Object.entries(playerPositions).map(([playerId, position]) => {
          const player = selectedPlayers.find(p => (p._id || p.id) === playerId);
          if (!player || !position.x || !position.y) return null;
          
          const playerName = player.fullName || player.name || 'Player';
          const isSelected = selectedPlayer && (selectedPlayer._id || selectedPlayer.id) === playerId;
          
          return (
            <div
              key={playerId}
              className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                isSelected ? 'bg-orange-500 scale-110' : 'bg-blue-500'
              } shadow-lg z-10`}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`
              }}
              onClick={() => onPlayerSelect && onPlayerSelect(player)}
              title={`${playerName} - ${position.position}`}
            >
              {playerName.charAt(0).toUpperCase()}
            </div>
          );
        })}
        
        {/* Instructions overlay */}
        {Object.keys(playerPositions).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 text-white px-4 py-2 rounded-lg text-center">
              <p className="text-sm font-medium mb-1">📋 Simple Field View</p>
              <p className="text-xs">Drag players from the right panel to position them</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Clear button */}
      {Object.keys(playerPositions).length > 0 && onClearPositions && (
        <button
          onClick={onClearPositions}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default SimpleField;
