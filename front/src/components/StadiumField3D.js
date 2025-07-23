import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getImageUrl, handleImageError } from '../shared/utils/imageUtils';

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


// Player sphere component (read-only for visualization)
const Player3D = ({ position, player, isSelected, onClick }) => {
  const meshRef = useRef();

  const handlePointerDown = (event) => {
    event.stopPropagation();
    onClick?.(player);
  };

  const playerName = player.fullName || player.name || player.email?.split('@')[0] || 'Player';
  
  // Get profile image URL if available
  const profileImageUrl = player.profileImage ? getImageUrl(player.profileImage, 'user') : null;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
    >
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshStandardMaterial 
        color={isSelected ? '#ff6b35' : '#0ea5e9'} 
        metalness={0.3}
        roughness={0.4}
        emissive={isSelected ? '#ff6b35' : '#000000'}
        emissiveIntensity={isSelected ? 0.5 : 0}
      />
      <Html position={[0, 4, 0]} center>
        <div className="text-center text-white text-xs bg-black/50 px-2 py-1 rounded select-none">
          {playerName}
          {profileImageUrl && (
            <img 
              src={profileImageUrl} 
              alt={playerName}
              className="hidden" // Hidden, just for preloading
              onError={(e) => handleImageError(e, 'user', playerName)}
            />
          )}
        </div>
      </Html>
    </mesh>
  );
};

// Enhanced Light Tower component
const LightTower = ({ position }) => (
  <group position={position}>
    {/* Tower Base */}
    <mesh position={[0, 0, 0]}>
      <cylinderGeometry args={[2, 3, 8, 8]} />
      <meshStandardMaterial color="#2d3748" roughness={0.8} />
    </mesh>
    {/* Main Tower */}
    <mesh position={[0, 40, 0]}>
      <cylinderGeometry args={[1, 1.5, 80, 8]} />
      <meshStandardMaterial color="#4a5568" roughness={0.7} metalness={0.3} />
    </mesh>
    {/* Light Fixture Housing */}
    <mesh position={[0, 75, 0]}>
      <boxGeometry args={[4, 6, 8]} />
      <meshStandardMaterial color="#1a202c" roughness={0.4} metalness={0.6} />
    </mesh>
    {/* Main Stadium Light */}
    <spotLight
      color="#ffdca8"
      position={[0, 70, 0]}
      target-position={[position[0] > 0 ? -30 : 30, 0, position[2] > 0 ? -20 : 20]}
      intensity={1.2}
      angle={Math.PI / 4}
      penumbra={0.2}
      distance={200}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={1}
      shadow-camera-far={200}
    />
    {/* Secondary Lights */}
    <spotLight
      color="#ffdca8"
      position={[2, 65, 2]}
      target-position={[0, 0, 0]}
      intensity={0.8}
      angle={Math.PI / 6}
      penumbra={0.4}
      distance={150}
    />
    <spotLight
      color="#ffdca8"
      position={[-2, 65, -2]}
      target-position={[0, 0, 0]}
      intensity={0.8}
      angle={Math.PI / 6}
      penumbra={0.4}
      distance={150}
    />
  </group>
);





const Stadium = () => {
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
    </group>
  );
};

// 3D Stadium Field Component (Read-only visualization)
const StadiumField3DInner = ({
  selectedPlayers = [],
  playerPositions = {},
  selectedPlayer,
  onPlayerSelect
}) => {
  const fieldWidth = 105; // FIFA standard
  const fieldHeight = 68; // FIFA standard
  const controlsRef = useRef();

  const getPlayer3DPosition = (player) => {
    const playerId = player._id || player.id;
    const pos = playerPositions[playerId];
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
      // Denormalize from percentage
      const x = (pos.x / 100) * fieldWidth - fieldWidth / 2;
      const z = (pos.y / 100) * fieldHeight - fieldHeight / 2;
      return [x, 1, z];
    }
    // Return null if no position is set - player won't be rendered
    return null;
  };

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-neutral-700 bg-gray-800 relative">
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
          
          <Stadium />

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
      <div className="absolute top-2 left-2 bg-blue-500/80 text-white px-3 py-1 rounded-lg text-xs font-medium">
        📊 3D Visualization (Read-only)
      </div>
    </div>
  );
};

// 2D Player component
const Player2D = ({ player, position, onDragStart, isSelected, onPlayerSelect }) => {
  const playerName = player.fullName || player.name || player.email?.split('@')[0] || 'Player';
  const playerInitials = playerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const playerColor = isSelected ? '#ff6b35' : '#0ea5e9';
  
  // Get profile image URL if available using imageUtils
  const profileImageUrl = player.profileImage ? getImageUrl(player.profileImage, 'user') : null;

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStart(e, player);
    onPlayerSelect?.(player);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onPlayerSelect?.(player);
      }}
      className="absolute w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-grab transition-all duration-200 select-none hover:scale-110 overflow-hidden"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        backgroundColor: profileImageUrl ? 'transparent' : playerColor,
        border: isSelected ? '3px solid white' : '2px solid #ffffffaa',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        transform: 'translate(-50%, -50%)',
        userSelect: 'none'
      }}
      title={`${playerName} - Drag to move`}
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
  onPlayerSelect
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
    
    // Change cursor
    document.body.style.cursor = 'grabbing';
  };

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

  const handleMouseUp = (e) => {
    if (draggingPlayer) {
      e.preventDefault();
      setDraggingPlayer(null);
      setDragOffset({ x: 0, y: 0 });
      document.body.style.cursor = '';
    }
  };

  useEffect(() => {
    if (draggingPlayer) {
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
  }, [draggingPlayer, dragOffset, onPlayerPositionChange]);

  return (
    <div
      ref={fieldRef}
      className="relative w-full h-96 rounded-lg overflow-hidden border-2 border-neutral-700 bg-cover bg-center"
      style={{
        backgroundImage: `url('/assets/stadium.jpg')`,
      }}
      onClick={(e) => {
        // Handle clicking on the field to position the selected player
        if (selectedPlayer && onPlayerPositionChange && !draggingPlayer) {
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
        e.preventDefault(); // Allow drop
      }}
      onDragEnter={(e) => {
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
          />
        );
      })}
      
      {/* Instructions overlay */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white p-2 rounded text-xs">
        <p>🖱️ Click players to select them</p>
        <p>🖱️ Drag players to reposition</p>
        {selectedPlayer && (
          <p className="text-yellow-300">💡 Click field to position {selectedPlayer.fullName || selectedPlayer.name || 'player'}</p>
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

  const Fallback2D = <div className="w-full h-96"><StadiumField2D {...props} /></div>;

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
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Only set to false if we're actually leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
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
      
      {/* Drag overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-sky-400/20 border-2 border-sky-400 border-dashed rounded-lg flex items-center justify-center pointer-events-none z-10">
          <div className="bg-sky-600/90 text-white px-4 py-2 rounded-lg font-medium">
            Drop player here to position them on the field
          </div>
        </div>
      )}
      
      {/* Control buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={handleClearField}
          className="bg-red-600/80 hover:bg-red-500/90 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 shadow-lg z-20"
        >
          Clear Field
        </button>
        <button
          onClick={() => setIs3D(!is3D)}
          disabled={hasError}
          className="bg-gray-800/80 hover:bg-gray-700/90 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 shadow-lg z-20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {is3D && !hasError ? 'Switch to 2D' : 'Switch to 3D'}
        </button>
      </div>
      
      {hasError && (
          <div className="absolute top-2 left-2 bg-yellow-500/80 text-black text-xs px-2 py-1 rounded">
              3D view disabled due to an error.
          </div>
      )}
    </div>
  );
};

export default StadiumField;
