import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import { getImageUrl, handleImageError } from '../../../../shared/utils/imageUtils';
import './StadiumField3D.css';

// A simple ErrorBoundary to catch errors in the 3D scene
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("WebGL Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-700">Something went wrong with the 3D view.</div>;
    }
    return this.props.children;
  }
}


// Enhanced Player3D component with improved visualization
const Player3D = ({ position, player, isSelected, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const handlePointerDown = (event) => {
    event.stopPropagation();
    onClick?.(player);
  };

  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  const playerName = player.fullName || player.name || player.email?.split('@')[0] || 'Player';
  
  // Get profile image URL if available - check both direct profileImage and userInfo.profileImage
  const profileImageUrl = (player.profileImage || player.userInfo?.profileImage) 
    ? getImageUrl(player.profileImage || player.userInfo?.profileImage, 'user') 
    : '/placeholder-user.jpg';

  // Visual states for hover/select effects
  const isActive = isSelected || hovered;
  const glowColor = isSelected ? '#ff6b35' : (hovered ? '#ffffff' : '#000000');
  const glowIntensity = isSelected ? 0.6 : (hovered ? 0.4 : 0);
  const sphereOpacity = isActive ? 0.8 : 0.15;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Player sphere with enhanced visuals */}
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshStandardMaterial 
        color={isSelected ? '#ff6b35' : (hovered ? '#505050' : 'transparent')}
        metalness={0.4}
        roughness={0.3}
        emissive={glowColor}
        emissiveIntensity={glowIntensity}
        opacity={sphereOpacity}
        transparent={true}
      />
      
      {/* Player info card with profile image */}
      <Html position={[0, 4, 0]} center>
        <div className={`text-center space-y-1 select-none player-profile-container ${isSelected ? 'selected' : ''}`}>
          {/* User Profile Image */}
          <div className="mx-auto w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-lg player-profile-image-wrapper">
            <img 
              src={profileImageUrl} 
              alt={playerName}
              className="player-profile-image"
              onError={(e) => handleImageError(e, 'user', playerName)}
            />
          </div>
          {/* Player Name */}
          <div className="text-white text-xs rounded player-name-tag">
            {playerName}
          </div>
        </div>
      </Html>
    </mesh>
  );
};




const Stadium = ({ team = null }) => {
  // Standard football field dimensions (in meters, scaled down for 3D scene)
  const fieldWidth = 105; // FIFA standard: 100-110m, using 105m
  const fieldHeight = 68; // FIFA standard: 64-75m, using 68m
  
  // Load the stadium texture
  const fieldTexture = useTexture('/assets/stadium.jpg');
  
  // Rotate the texture by 90 degrees
  fieldTexture.rotation = Math.PI / 2;
  fieldTexture.center.set(0.5, 0.5);
  
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      {/* Main Field with rotated texture */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[fieldWidth, fieldHeight]} />
        <meshStandardMaterial 
          map={fieldTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Team logo display in the center of the field */}
      {team && team.profileImage && (
        <group position={[0, 0.05, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[12, 12]} />
            <meshBasicMaterial transparent opacity={0.6}>
              <Html transform position={[0, 0, 0.1]} center>
                <div className="team-profile-container">
                  <div className="team-profile-image-wrapper">
                    <img 
                      src={getImageUrl(team.profileImage, 'team')}
                      alt={team.name || 'Team'} 
                      className="team-profile-image"
                      onError={(e) => handleImageError(e, 'team', team.name)}
                    />
                  </div>
                  {team.name && (
                    <div className="text-white text-sm font-bold mt-2 px-3 py-1 bg-black/50 rounded-full backdrop-blur-sm">
                      {team.name}
                    </div>
                  )}
                </div>
              </Html>
            </meshBasicMaterial>
          </mesh>
        </group>
      )}
    </group>
  );
};

// 3D Stadium Field Component (Read-only visualization)
const StadiumField3DInner = ({
  selectedPlayers = [],
  playerPositions = {},
  selectedPlayer,
  onPlayerSelect,
  team = null
}) => {
  const fieldWidth = 105; // FIFA standard
  const fieldHeight = 68; // FIFA standard
  const controlsRef = useRef();

  const getPlayer3DPosition = (player) => {
    const playerId = player._id || player.id;
    const pos = playerPositions[playerId];
    
    console.log('StadiumField3D - Getting position for player:', {
      player: player,
      playerId: playerId,
      position: pos,
      playerPositions: playerPositions
    });
    
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
      // Denormalize from percentage
      const x = (pos.x / 100) * fieldWidth - fieldWidth / 2;
      const z = (pos.y / 100) * fieldHeight - fieldHeight / 2;
      // Set player height to 2 to make profile images more visible
      console.log('StadiumField3D - Calculated 3D position:', [x, 2, z]);
      return [x, 2, z];
    }
    // Return null if no position is set - player won't be rendered
    console.log('StadiumField3D - No valid position found, returning null');
    return null;
  };

  return (
    <div className="w-full h-[550px] rounded-lg overflow-hidden border-2 border-neutral-700 bg-gray-800 relative">
      <Canvas
        camera={{ position: [0, 120, 120], fov: 45 }}
        shadows
      >
        <Suspense fallback={<Html center>Loading 3D View...</Html>}>
          <ambientLight intensity={1} />
          <hemisphereLight groundColor={"#4a7a4a"} intensity={0.3} />
          <directionalLight
            castShadow
            position={[40, 50, 30]}
            intensity={1}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={150}
            shadow-camera-left={-80}
            shadow-camera-right={80}
            shadow-camera-top={80}
            shadow-camera-bottom={-80}
          />
          <fog attach="fog" args={['#101820', 120, 300]} />
          
          <Stadium team={team} />

          {Array.isArray(selectedPlayers) && selectedPlayers.map((player) => {
            const playerId = player._id || player.id;
            const isSelected = selectedPlayer?._id === playerId || selectedPlayer?.id === playerId;
            const position = getPlayer3DPosition(player);
            
            // Only render player if they have a position on the field
            if (!position) return null;
            
            return (
              <Player3D
                key={playerId}
                position={position}
                player={player}
                isSelected={isSelected}
                onClick={onPlayerSelect}
              />
            );
          })}
          
          <OrbitControls 
            ref={controlsRef}
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={50}
            maxDistance={250}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Suspense>
      </Canvas>
      
      {/* Read-only notice */}
      <div className="absolute top-2 left-2 bg-neutral-800/90 text-white px-3 py-1 rounded-lg text-xs font-medium border border-neutral-600 shadow-md">
        📊 3D Visualization (Read-only)
      </div>
    </div>
  );
};

// 2D Player component
const Player2D = ({ player, position, onDragStart, isSelected, onPlayerSelect, readOnly = false }) => {
  const playerName = player.fullName || player.name || player.email?.split('@')[0] || 'Player';
  const playerInitials = playerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const playerColor = isSelected ? '#ff6b35' : '#0ea5e9';
  
  // Get profile image URL if available using imageUtils - check both direct profileImage and userInfo.profileImage
  const profileImageUrl = (player.profileImage || player.userInfo?.profileImage) 
    ? getImageUrl(player.profileImage || player.userInfo?.profileImage, 'user') 
    : null;

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStart(e, player);
    onPlayerSelect?.(player);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onPlayerSelect?.(player);
  };

  // Conditional props object - only add event handlers if not readOnly
  const eventHandlers = readOnly ? {} : {
    onMouseDown: handleMouseDown,
    onClick: handleClick
  };

  return (
    <div
      {...eventHandlers}
      className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 select-none ${readOnly ? 'cursor-default' : 'cursor-grab hover:scale-110'} overflow-hidden`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        backgroundColor: profileImageUrl ? 'transparent' : playerColor,
        border: isSelected ? '3px solid white' : '2px solid #ffffffaa',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        transform: 'translate(-50%, -50%)',
        userSelect: 'none',
        pointerEvents: readOnly ? 'none' : 'auto'
      }}
      title={readOnly ? `${playerName} - View Only` : `${playerName} - Drag to move`}
      draggable={false}
    >
      {profileImageUrl ? (
        <img 
          src={profileImageUrl} 
          alt={playerName}
          className="w-full h-full object-cover"
          onError={(e) => {
            handleImageError(e, 'user', playerName);
            e.target.parentElement.style.backgroundColor = playerColor;
          }}
        />
      ) : (
        playerInitials
      )}
      <div className="absolute -bottom-5 text-xs bg-black/70 px-2 py-0.5 rounded whitespace-nowrap pointer-events-none">
        {playerName}
      </div>
    </div>
  );
};

// 2D Stadium Field Component
const StadiumField2D = ({
  selectedPlayers = [],
  playerPositions = {},
  onPlayerPositionChange,
  selectedPlayer,
  onPlayerSelect,
  team = null,
  readOnly = false
}) => {
  const fieldRef = useRef(null);
  const [draggingPlayer, setDraggingPlayer] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getPlayer2DPosition = (player) => {
    const playerId = player._id || player.id;
    const pos = playerPositions[playerId];
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
      return { x: pos.x, y: pos.y };
    }
    // Return null if no position is set - player won't be rendered
    return null;
  };

  const handleDragStart = (e, player) => {
    if (readOnly) {
      e.preventDefault();
      e.stopPropagation();
      return; // Prevent drag in read-only mode
    }
    e.preventDefault();
    e.stopPropagation();
    
    if (!fieldRef.current) return;
    
    const playerId = player._id || player.id;
    const pos = playerPositions[playerId];
    
    // Only allow dragging if player is positioned on the field
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') return;
    
    const playerElement = e.currentTarget;
    const playerRect = playerElement.getBoundingClientRect();
    
    // Calculate offset from mouse to player center
    const offsetX = e.clientX - (playerRect.left + playerRect.width / 2);
    const offsetY = e.clientY - (playerRect.top + playerRect.height / 2);
    
    setDraggingPlayer({ ...player, id: playerId });
    setDragOffset({ x: offsetX, y: offsetY });
    
    // Change cursor
    document.body.style.cursor = 'grabbing';
  };

  // Clear dragging state if we switch to read-only mode
  useEffect(() => {
    if (readOnly && draggingPlayer) {
      setDraggingPlayer(null);
      setDragOffset({ x: 0, y: 0 });
      document.body.style.cursor = '';
    }
  }, [readOnly, draggingPlayer]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingPlayer || !fieldRef.current || !onPlayerPositionChange || readOnly) return;
      
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

    const handleMouseUp = (e) => {
      if (draggingPlayer) {
        e.preventDefault();
        setDraggingPlayer(null);
        setDragOffset({ x: 0, y: 0 });
        document.body.style.cursor = '';
      }
    };

    if (draggingPlayer && !readOnly) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [draggingPlayer, dragOffset, onPlayerPositionChange, readOnly]);

  return (
    <div
      ref={fieldRef}
      className="relative w-full h-[550px] rounded-lg overflow-hidden border-2 border-neutral-700 bg-cover bg-center"
      style={{
        backgroundImage: `url('/assets/stadium.jpg')`,
      }}
      onClick={(e) => {
        // Handle clicking on the field to position the selected player - Only if not readOnly
        if (!readOnly && selectedPlayer && onPlayerPositionChange && !draggingPlayer) {
          const fieldRect = fieldRef.current.getBoundingClientRect();
          let x = ((e.clientX - fieldRect.left) / fieldRect.width) * 100;
          let y = ((e.clientY - fieldRect.top) / fieldRect.height) * 100;

          // Clamp position to field bounds
          x = Math.max(0, Math.min(100, x));
          y = Math.max(0, Math.min(100, y));

          const playerId = selectedPlayer._id || selectedPlayer.id;
          onPlayerPositionChange(playerId, { x, y });
        }
      }}
      onDrop={(e) => {
        if (readOnly) {
          e.preventDefault();
          e.stopPropagation();
          return; // Prevent drop in read-only mode
        }
        e.preventDefault();
        const fieldRect = fieldRef.current.getBoundingClientRect();
        let x = ((e.clientX - fieldRect.left) / fieldRect.width) * 100;
        let y = ((e.clientY - fieldRect.top) / fieldRect.height) * 100;

        // Clamp position to field bounds
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        // Get the dragged player data
        const playerData = e.dataTransfer.getData('application/json');
        if (playerData && onPlayerPositionChange) {
          try {
            const player = JSON.parse(playerData);
            const playerId = player._id || player.id;
            onPlayerPositionChange(playerId, { x, y });
          } catch (error) {
            console.error('Error parsing dropped player data:', error);
          }
        }
      }}
      onDragOver={(e) => {
        if (readOnly) {
          e.preventDefault();
          e.stopPropagation();
          return; // Prevent drag over in read-only mode
        }
        e.preventDefault(); // Allow drop
      }}
      onDragEnter={(e) => {
        if (readOnly) {
          e.preventDefault();
          e.stopPropagation();
          return; // Prevent drag enter in read-only mode
        }
        e.preventDefault(); // Allow drop
      }}
    >
      {/* Field lines are now part of the background image. */}

      {Array.isArray(selectedPlayers) && selectedPlayers.map((player) => {
        const playerId = player._id || player.id;
        const isSelected = selectedPlayer?._id === playerId || selectedPlayer?.id === playerId;
        const position = getPlayer2DPosition(player);
        
        // Only render player if they have a position on the field
        if (!position) return null;
        
        return (
          <Player2D
            key={playerId}
            player={player}
            position={position}
            onDragStart={handleDragStart}
            isSelected={isSelected}
            onPlayerSelect={onPlayerSelect}
            readOnly={readOnly}
          />
        );
      })}
      
      {/* Team Logo Overlay in 2D */}
      {team && team.profileImage && (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 stadium-field-container">
          <div className="team-profile-container" style={{ opacity: 0.6 }}>
            <div className="team-profile-image-wrapper">
              <img 
                src={getImageUrl(team.profileImage, 'team')}
                alt={team.name || 'Team'} 
                className="team-profile-image"
                onError={(e) => handleImageError(e, 'team', team.name)}
              />
            </div>
            {team.name && (
              <div className="text-white text-xs font-bold mt-2 px-2 py-0.5 bg-black/70 rounded-full backdrop-blur-sm text-center shadow-md">
                {team.name}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Instructions overlay */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white p-2 rounded text-xs">
        {readOnly ? (
          <>
            <p>�️ View Only Mode</p>
            <p>�🖱️ Click players to view details</p>
          </>
        ) : (
          <>
            <p>🖱️ Click players to select them</p>
            <p>🖱️ Drag players to reposition</p>
            {selectedPlayer && (
              <p className="text-yellow-300">💡 Click field to position {selectedPlayer.fullName || selectedPlayer.name || 'player'}</p>
            )}
          </>
        )}
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
      
      {/* Dragging indicator */}
      {draggingPlayer && (
        <div className="absolute top-2 right-2 bg-orange-500/80 text-white px-3 py-1 rounded-lg text-xs font-medium animate-pulse">
          🖱️ Dragging {draggingPlayer.fullName || draggingPlayer.name || 'player'}
        </div>
      )}
    </div>
  );
};

// Main component to switch between 2D and 3D
const StadiumField = (props) => {
  const [is3D, setIs3D] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const Fallback2D = <div className="w-full h-[550px]"><StadiumField2D {...props} /></div>;

  // This effect will switch to 2D if an error is caught by the boundary
  const handle3DError = () => {
    setHasError(true);
    setIs3D(false);
  };

  // Clear all player positions
  const handleClearField = () => {
    // Instead of calling onPlayerPositionChange with null, 
    // we'll call a dedicated clear function if available,
    // or simulate clearing by calling onPlayerPositionChange with undefined positions
    if (props.onClearPositions) {
      // If parent provides a dedicated clear function, use it
      props.onClearPositions();
    } else if (props.selectedPlayers && props.onPlayerPositionChange) {
      // Fallback: try to clear by setting positions to a special value that parent can handle
      props.selectedPlayers.forEach(player => {
        const playerId = player._id || player.id;
        // We'll pass an object that indicates clearing instead of null
        props.onPlayerPositionChange(playerId, { clear: true });
      });
    }
  };

  // Handle drag-and-drop events
  const handleDragOver = (e) => {
    if (props.readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e) => {
    if (props.readOnly) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (props.readOnly) return;
    e.preventDefault();
    // Only clear drag state if we're leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    if (props.readOnly) return;
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'player' && data.player) {
        const player = data.player;
        const playerId = player._id || player.id;
        
        // Check if player is already in selectedPlayers list
        const isPlayerSelected = props.selectedPlayers && props.selectedPlayers.find(p => (p._id || p.id) === playerId);
        
        // If player is not in selected list, we need to add them first
        // We'll position them regardless and let the parent component handle adding them to the list
        
        // Get the field dimensions and click position
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate relative position (0-100% of field)
        const relativeX = (x / rect.width) * 100;
        const relativeY = (y / rect.height) * 100;
        
        // Clamp to field bounds
        const clampedX = Math.max(0, Math.min(100, relativeX));
        const clampedY = Math.max(0, Math.min(100, relativeY));
        
        // Set the player position using the same format as handleFieldClick
        if (props.onPlayerPositionChange) {
          props.onPlayerPositionChange(playerId, { x: clampedX, y: clampedY });
        }
        
        // Also select the player if there's a selection handler
        if (props.onPlayerSelect) {
          props.onPlayerSelect(player);
        }
        
        // If the player is not in the selected list, we need to trigger an add action
        // We'll pass this information up to the parent component via a custom event or callback
        if (!isPlayerSelected && props.onPlayerAdd) {
          props.onPlayerAdd(player);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <div 
      className={`relative ${isDragOver ? 'ring-2 ring-sky-400 ring-opacity-50' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ErrorBoundary fallback={Fallback2D} onError={handle3DError}>
        {is3D && !hasError ? <StadiumField3DInner {...props} /> : <StadiumField2D {...props} />}
      </ErrorBoundary>
      
      {/* Drag overlay indicator - Only show if not readOnly */}
      {isDragOver && !props.readOnly && (
        <div className="absolute inset-0 bg-sky-400/20 border-2 border-sky-400 border-dashed rounded-lg flex items-center justify-center pointer-events-none z-10">
          <div className="bg-sky-600/90 text-white px-4 py-2 rounded-lg font-medium">
            Drop player here to position them on the field
          </div>
        </div>
      )}
      
      {/* Modern control buttons - Only show if not readOnly */}
      {!props.readOnly && (
        <div className="field-controls">
          <button
            onClick={handleClearField}
            className="field-control-button"
            title="Clear Field"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
          <button
            onClick={() => setIs3D(!is3D)}
            disabled={hasError}
            className="field-control-button"
            title={is3D && !hasError ? 'Switch to 2D View' : 'Switch to 3D View'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {is3D && !hasError ? (
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              ) : (
                <path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"></path>
              )}
            </svg>
          </button>
        </div>
      )}
      
      {/* Modern read-only indicator */}
      {props.readOnly && (
        <div className="absolute top-3 right-3 bg-neutral-800/70 text-white text-xs px-3 py-1.5 rounded-full z-20 border border-neutral-600/50 backdrop-blur-sm flex items-center space-x-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            <path d="M2 2l7.586 7.586"></path>
            <circle cx="11" cy="11" r="2"></circle>
          </svg>
          <span>View Only</span>
        </div>
      )}
      
      {hasError && (
          <div className="absolute top-2 left-2 bg-yellow-500/80 text-black text-xs px-2 py-1 rounded">
              3D view disabled due to an error.
          </div>
      )}
    </div>
  );
};

export default StadiumField;
