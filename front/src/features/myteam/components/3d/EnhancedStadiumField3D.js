import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Loader } from '@react-three/drei';
import { Suspense } from 'react';
import SketchfabModel from './SketchfabModel';
import { getImageUrl, handleImageError } from '../../../../shared/utils/imageUtils';

/**
 * Enhanced 3D Stadium with Sketchfab Model Support
 * 
 * How to get models from Sketchfab:
 * 1. Go to sketchfab.com and find a model
 * 2. Download the GLB file (requires account)
 * 3. Place it in public/models/ folder
 * 4. Reference it as "/models/yourmodel.glb"
 * 
 * Popular sports-related models to search for:
 * - "football stadium"
 * - "soccer field" 
 * - "football player"
 * - "soccer ball"
 * - "goal post"
 */

// Loading fallback component
const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#333" />
  </mesh>
);

// Example Sketchfab Player Component (using 3D model instead of sphere)
const SketchfabPlayer = ({ 
  position, 
  player, 
  isSelected, 
  onClick,
  modelUrl = "/models/football-player.glb" // Default model path
}) => {
  const handleClick = (event) => {
    event.stopPropagation();
    onClick?.(player);
  };

  const playerName = player.fullName || player.name || player.email?.split('@')[0] || 'Player';
  
  // Get profile image URL if available using imageUtils
  const profileImageUrl = player.profileImage ? getImageUrl(player.profileImage, 'user') : null;

  return (
    <group position={position}>
      <Suspense fallback={<LoadingFallback />}>
        <SketchfabModel
          url={modelUrl}
          scale={[0.5, 0.5, 0.5]} // Adjust scale as needed
          position={[0, 0, 0]}
          onClick={handleClick}
          materialOverrides={{
            color: isSelected ? '#ff6b35' : '#0ea5e9',
            emissive: isSelected ? '#ff6b35' : '#000000',
            emissiveIntensity: isSelected ? 0.3 : 0
          }}
        />
        {/* Player name label */}
        <mesh position={[0, 3, 0]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial 
            color="#000000" 
            opacity={0.7} 
            transparent 
          />
        </mesh>
        <text
          position={[0, 3, 0.01]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {playerName}
        </text>
        
        {/* Invisible HTML element for preloading profile image if available */}
        {profileImageUrl && (
          <Html position={[0, 0, 0]} style={{ display: 'none' }}>
            <img 
              src={profileImageUrl} 
              alt={playerName}
              onError={(e) => handleImageError(e, 'user', playerName)}
            />
          </Html>
        )}
      </Suspense>
    </group>
  );
};

// Example Stadium Model Component
const SketchfabStadium = ({ 
  modelUrl = "/models/football-stadium.glb",
  showModel = true 
}) => {
  if (!showModel) return null;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <SketchfabModel
        url={modelUrl}
        position={[0, -5, 0]}
        scale={[10, 10, 10]}
        rotation={[0, 0, 0]}
      />
    </Suspense>
  );
};

// Main Enhanced Stadium Component
const EnhancedStadiumField3D = ({
  players = [],
  playerPositions = {},
  onPlayerSelect,
  selectedPlayer,
  use3DModels = true, // Toggle between 3D models and simple shapes
  stadiumModelUrl = "/models/stadium.glb",
  playerModelUrl = "/models/player.glb",
  showStadiumModel = false // Set to true to use Sketchfab stadium model
}) => {
  const [modelLoadError, setModelLoadError] = useState(false);

  // Fallback to simple shapes if models fail to load
  const PlayerComponent = use3DModels && !modelLoadError ? SketchfabPlayer : SimplePlayer;

  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      <Canvas
        camera={{ 
          position: [0, 50, 100], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        shadows
        onError={(error) => {
          console.error('3D Scene Error:', error);
          setModelLoadError(true);
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[50, 50, 25]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          {/* Environment for better lighting (optional) */}
          <Environment preset="sunset" />
          
          {/* Stadium Model or Simple Field */}
          {showStadiumModel ? (
            <SketchfabStadium 
              modelUrl={stadiumModelUrl}
              showModel={!modelLoadError}
            />
          ) : (
            <SimpleField />
          )}
          
          {/* Players */}
          {players.map((player, index) => {
            const playerId = player._id || player.id || `player-${index}`;
            const position = playerPositions[playerId] || [
              (Math.random() - 0.5) * 80, 
              1, 
              (Math.random() - 0.5) * 40
            ];
            
            return (
              <PlayerComponent
                key={playerId}
                position={position}
                player={player}
                isSelected={selectedPlayer === player}
                onClick={onPlayerSelect}
                modelUrl={playerModelUrl}
              />
            );
          })}
          
          {/* Camera Controls */}
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            maxDistance={200}
            minDistance={20}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
      
      {/* Loading indicator */}
      <Loader />
      
      {/* Model load error message */}
      {modelLoadError && (
        <div className="absolute top-2 right-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm">
          3D models failed to load, using fallback shapes
        </div>
      )}
    </div>
  );
};

// Simple fallback components
const SimplePlayer = ({ position, player, isSelected, onClick }) => {
  // Get profile image URL if available using imageUtils
  const profileImageUrl = player.profileImage ? getImageUrl(player.profileImage, 'user') : null;
  const playerName = player.fullName || player.name || player.email?.split('@')[0] || 'Player';
  
  return (
    <mesh
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(player);
      }}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        color={isSelected ? '#ff6b35' : '#0ea5e9'} 
      />
      
      {/* Invisible HTML element for preloading profile image if available */}
      {profileImageUrl && (
        <Html style={{ display: 'none' }}>
          <img 
            src={profileImageUrl} 
            alt={playerName}
            onError={(e) => handleImageError(e, 'user', playerName)}
          />
        </Html>
      )}
    </mesh>
  );
};

const SimpleField = () => (
  <group>
    {/* Field */}
    <mesh position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 60]} />
      <meshStandardMaterial color="#2d5a2d" />
    </mesh>
    
    {/* Goal posts */}
    <mesh position={[-45, 5, 0]}>
      <boxGeometry args={[2, 10, 20]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    <mesh position={[45, 5, 0]}>
      <boxGeometry args={[2, 10, 20]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  </group>
);

export default EnhancedStadiumField3D;
