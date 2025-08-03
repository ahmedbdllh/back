import React, { useRef, useState, useEffect } from 'react';

const StadiumField2DFallback = ({ 
  selectedPlayers = [], 
  playerPositions = {}, 
  onPlayerPositionChange,
  selectedPlayer,
  onPlayerSelect 
}) => {
  const fieldRef = useRef(null);
  const [draggingPlayer, setDraggingPlayer] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Simple 2D field as fallback
  const getPlayerStyle = (player) => {
    const playerId = player._id || player.id;
    const pos = playerPositions[playerId];
    const isSelected = selectedPlayer?._id === playerId || selectedPlayer?.id === playerId;
    
    return {
      position: 'absolute',
      left: pos ? `${pos.x}%` : '50%',
      top: pos ? `${pos.y}%` : '50%',
      transform: 'translate(-50%, -50%)',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: isSelected ? '#ff6b35' : '#0ea5e9',
      border: isSelected ? '3px solid white' : '2px solid white',
      cursor: 'grab',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 'bold',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      transition: draggingPlayer?.id === playerId ? 'none' : 'all 0.2s ease',
      zIndex: isSelected ? 10 : 1,
      userSelect: 'none'
    };
  };

  const getPlayerInitials = (player) => {
    const name = player.fullName || player.name || player.email?.split('@')[0] || 'P';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle mouse down on a player to start dragging
  const handlePlayerMouseDown = (e, player) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!fieldRef.current) return;
    
    const playerId = player._id || player.id;
    const pos = playerPositions[playerId];
    
    // Only allow dragging if player is positioned on the field
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') return;
    
    const fieldRect = fieldRef.current.getBoundingClientRect();
    const playerElement = e.currentTarget;
    const playerRect = playerElement.getBoundingClientRect();
    
    // Calculate offset from mouse to player center
    const offsetX = e.clientX - (playerRect.left + playerRect.width / 2);
    const offsetY = e.clientY - (playerRect.top + playerRect.height / 2);
    
    setDraggingPlayer({ ...player, id: playerId });
    setDragOffset({ x: offsetX, y: offsetY });
    onPlayerSelect?.(player);
    
    // Change cursor
    playerElement.style.cursor = 'grabbing';
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!draggingPlayer || !fieldRef.current || !onPlayerPositionChange) return;
    
    e.preventDefault();
    
    const fieldRect = fieldRef.current.getBoundingClientRect();
    
    // Calculate new position accounting for drag offset
    const mouseX = e.clientX - dragOffset.x;
    const mouseY = e.clientY - dragOffset.y;
    
    // Convert to percentage relative to field
    let x = ((mouseX - fieldRect.left) / fieldRect.width) * 100;
    let y = ((mouseY - fieldRect.top) / fieldRect.height) * 100;
    
    // Clamp to field bounds
    x = Math.max(2, Math.min(98, x));
    y = Math.max(2, Math.min(98, y));
    
    const playerId = draggingPlayer._id || draggingPlayer.id;
    onPlayerPositionChange(playerId, { x, y });
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = (e) => {
    if (draggingPlayer) {
      e.preventDefault();
      setDraggingPlayer(null);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Add event listeners for drag operations
  useEffect(() => {
    if (draggingPlayer) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [draggingPlayer, dragOffset, onPlayerPositionChange]);

  return (
    <div 
      ref={fieldRef}
      className="relative w-full h-96 bg-gradient-to-b from-green-600 to-green-800 rounded-lg overflow-hidden"
    >
      {/* Field background */}
      <div className="absolute inset-0 bg-green-500 opacity-80"></div>
      
      {/* Field markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
        {/* Outer boundary */}
        <rect x="20" y="20" width="360" height="260" fill="none" stroke="white" strokeWidth="2" />
        
        {/* Center line */}
        <line x1="200" y1="20" x2="200" y2="280" stroke="white" strokeWidth="2" />
        
        {/* Center circle */}
        <circle cx="200" cy="150" r="40" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="200" cy="150" r="2" fill="white" />
        
        {/* Goal areas */}
        <rect x="20" y="110" width="30" height="80" fill="none" stroke="white" strokeWidth="2" />
        <rect x="350" y="110" width="30" height="80" fill="none" stroke="white" strokeWidth="2" />
        
        {/* Penalty areas */}
        <rect x="20" y="85" width="60" height="130" fill="none" stroke="white" strokeWidth="2" />
        <rect x="320" y="85" width="60" height="130" fill="none" stroke="white" strokeWidth="2" />
        
        {/* Goals */}
        <rect x="15" y="130" width="5" height="40" fill="none" stroke="white" strokeWidth="2" />
        <rect x="380" y="130" width="5" height="40" fill="none" stroke="white" strokeWidth="2" />
      </svg>
      
      {/* Players */}
      {selectedPlayers.map((player, index) => {
        const playerId = player._id || player.id || `player-${index}`;
        const pos = playerPositions[playerId];
        
        // Only render players that have been positioned on the field
        if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
          return null;
        }
        
        return (
          <div
            key={playerId}
            style={getPlayerStyle(player)}
            onMouseDown={(e) => handlePlayerMouseDown(e, player)}
            onClick={(e) => {
              e.stopPropagation();
              onPlayerSelect?.(player);
            }}
            title={player.fullName || player.name || 'Player'}
          >
            {getPlayerInitials(player)}
          </div>
        );
      })}
      
      {/* Fallback notice */}
      <div className="absolute top-2 left-2 bg-yellow-500 text-black px-3 py-1 rounded-lg text-xs font-medium">
        ⚠️ 2D Mode (WebGL not available)
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white p-2 rounded text-xs">
        <p>🖱️ Click players to select them</p>
        <p>�️ Drag players to reposition</p>
      </div>
      
      {/* Player count */}
      {selectedPlayers.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-xs">
          <span className="text-green-300 font-bold">{selectedPlayers.filter(p => {
            const playerId = p._id || p.id;
            const pos = playerPositions[playerId];
            return pos && typeof pos.x === 'number' && typeof pos.y === 'number';
          }).length}</span> / <span className="text-blue-300 font-bold">{selectedPlayers.length}</span> positioned
        </div>
      )}
    </div>
  );
};

export default StadiumField2DFallback;
