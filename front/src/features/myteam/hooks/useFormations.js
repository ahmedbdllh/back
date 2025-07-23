import { useState, useCallback } from 'react';

export const useFormations = () => {
  const [selectedFormation, setSelectedFormation] = useState('');
  const [playerPositions, setPlayerPositions] = useState({});

  const getFormationSuggestions = useCallback((playerCount, sport = 'Football') => {
    console.log('Getting formation suggestions for player count:', playerCount, 'sport:', sport);
    const formations = {
      5: [
        { name: '1-2-2', description: '1 GK, 2 DEF, 2 ATT', positions: ['GK', 'DEF', 'DEF', 'ATT', 'ATT'] },
        { name: '1-3-1', description: '1 GK, 3 MID, 1 ATT', positions: ['GK', 'MID', 'MID', 'MID', 'ATT'] },
        { name: '1-1-3', description: '1 GK, 1 DEF, 3 ATT', positions: ['GK', 'DEF', 'ATT', 'ATT', 'ATT'] }
      ],
      6: [
        { name: '1-2-3', description: '1 GK, 2 DEF, 3 ATT', positions: ['GK', 'DEF', 'DEF', 'ATT', 'ATT', 'ATT'] },
        { name: '1-3-2', description: '1 GK, 3 MID, 2 ATT', positions: ['GK', 'MID', 'MID', 'MID', 'ATT', 'ATT'] },
        { name: '1-4-1', description: '1 GK, 4 MID, 1 ATT', positions: ['GK', 'MID', 'MID', 'MID', 'MID', 'ATT'] }
      ],
      7: [
        { name: '1-3-3', description: '1 GK, 3 DEF, 3 ATT', positions: ['GK', 'DEF', 'DEF', 'DEF', 'ATT', 'ATT', 'ATT'] },
        { name: '1-4-2', description: '1 GK, 4 MID, 2 ATT', positions: ['GK', 'MID', 'MID', 'MID', 'MID', 'ATT', 'ATT'] },
        { name: '1-2-4', description: '1 GK, 2 DEF, 4 ATT', positions: ['GK', 'DEF', 'DEF', 'ATT', 'ATT', 'ATT', 'ATT'] }
      ]
    };
    
    const result = formations[playerCount] || [];
    console.log('Formation suggestions result:', result);
    return result;
  }, []);

  const getFieldPositions = useCallback((formation, playerCount) => {
    const positions = {
      5: {
        '1-2-2': [
          { x: 50, y: 90, position: 'GK' },   // Bottom center - goalkeeper
          { x: 25, y: 65, position: 'DEF' },  // Left defender
          { x: 75, y: 65, position: 'DEF' },  // Right defender
          { x: 30, y: 25, position: 'ATT' },  // Left attacker
          { x: 70, y: 25, position: 'ATT' }   // Right attacker
        ],
        '1-3-1': [
          { x: 50, y: 90, position: 'GK' },   // Bottom center - goalkeeper
          { x: 25, y: 50, position: 'MID' },  // Left midfielder
          { x: 50, y: 50, position: 'MID' },  // Center midfielder
          { x: 75, y: 50, position: 'MID' },  // Right midfielder
          { x: 50, y: 20, position: 'ATT' }   // Center attacker
        ],
        '1-1-3': [
          { x: 50, y: 90, position: 'GK' },   // Bottom center - goalkeeper
          { x: 50, y: 65, position: 'DEF' },  // Center defender
          { x: 25, y: 25, position: 'ATT' },  // Left attacker
          { x: 50, y: 25, position: 'ATT' },  // Center attacker
          { x: 75, y: 25, position: 'ATT' }   // Right attacker
        ]
      },
      6: {
        '1-2-3': [
          { x: 50, y: 90, position: 'GK' },   // Bottom center - goalkeeper
          { x: 30, y: 65, position: 'DEF' },  // Left defender
          { x: 70, y: 65, position: 'DEF' },  // Right defender
          { x: 20, y: 25, position: 'ATT' },  // Left attacker
          { x: 50, y: 25, position: 'ATT' },  // Center attacker
          { x: 80, y: 25, position: 'ATT' }   // Right attacker
        ],
        '1-3-2': [
          { x: 50, y: 90, position: 'GK' },   // Bottom center - goalkeeper
          { x: 25, y: 50, position: 'MID' },  // Left midfielder
          { x: 50, y: 50, position: 'MID' },  // Center midfielder
          { x: 75, y: 50, position: 'MID' },  // Right midfielder
          { x: 35, y: 20, position: 'ATT' },  // Left attacker
          { x: 65, y: 20, position: 'ATT' }   // Right attacker
        ],
        '1-4-1': [
          { x: 50, y: 90, position: 'GK' },   // Bottom center - goalkeeper
          { x: 20, y: 50, position: 'MID' },  // Far left midfielder
          { x: 40, y: 50, position: 'MID' },  // Left center midfielder
          { x: 60, y: 50, position: 'MID' },  // Right center midfielder
          { x: 80, y: 50, position: 'MID' },  // Far right midfielder
          { x: 50, y: 20, position: 'ATT' }   // Center attacker
        ]
      },
      7: {
        '1-3-3': [
          { x: 50, y: 90, position: 'GK' },   // Bottom center - goalkeeper
          { x: 25, y: 65, position: 'DEF' },  // Left defender
          { x: 50, y: 65, position: 'DEF' },  // Center defender
          { x: 75, y: 65, position: 'DEF' },  // Right defender
          { x: 25, y: 25, position: 'ATT' },  // Left attacker
          { x: 50, y: 25, position: 'ATT' },  // Center attacker
          { x: 75, y: 25, position: 'ATT' }   // Right attacker
        ],
        '1-4-2': [
          { x: 50, y: 90, position: 'GK' },   // Bottom center - goalkeeper
          { x: 15, y: 50, position: 'MID' },  // Far left midfielder
          { x: 35, y: 50, position: 'MID' },  // Left center midfielder
          { x: 65, y: 50, position: 'MID' },  // Right center midfielder
          { x: 85, y: 50, position: 'MID' },  // Far right midfielder
          { x: 35, y: 20, position: 'ATT' },  // Left attacker
          { x: 65, y: 20, position: 'ATT' }   // Right attacker
        ],
        '1-2-4': [
          { x: 50, y: 90, position: 'GK' },   // Bottom center - goalkeeper
          { x: 35, y: 65, position: 'DEF' },  // Left defender
          { x: 65, y: 65, position: 'DEF' },  // Right defender
          { x: 15, y: 25, position: 'ATT' },  // Far left attacker
          { x: 35, y: 25, position: 'ATT' },  // Left center attacker
          { x: 65, y: 25, position: 'ATT' },  // Right center attacker
          { x: 85, y: 25, position: 'ATT' }   // Far right attacker
        ]
      }
    };
    return positions[playerCount]?.[formation] || [];
  }, []);

  const handleFormationSelect = useCallback((formation, selectedPlayers) => {
    console.log('handleFormationSelect called with:', { 
      formation: formation.name, 
      selectedPlayersCount: selectedPlayers.length,
      selectedPlayers: selectedPlayers.map(p => ({ id: p._id || p.id, name: p.fullName || p.name }))
    });
    
    setSelectedFormation(formation.name);
    const fieldPositions = getFieldPositions(formation.name, selectedPlayers.length);
    console.log('Field positions for formation:', fieldPositions);
    
    const newPositions = {};
    selectedPlayers.forEach((player, index) => {
      if (fieldPositions[index]) {
        newPositions[player._id || player.id] = {
          x: fieldPositions[index].x,
          y: fieldPositions[index].y,
          position: fieldPositions[index].position,
          isStarter: true
        };
      }
    });
    
    console.log('New player positions:', newPositions);
    setPlayerPositions(newPositions);
  }, [getFieldPositions]);

  // Detect position based on Y coordinate (vertical field reading)
  const getPositionFromCoordinates = useCallback((x, y) => {
    // Y coordinate determines position (vertical field - bottom to top)
    // GK: 10%, DEF: 20%, MID: 50%, ATT: 20%
    if (y >= 90) {
      return 'GK';  // Bottom 10% - goalkeeper area
    } else if (y >= 70) {
      return 'DEF'; // Next 20% (70-90%) - defensive area
    } else if (y >= 20) {
      return 'MID'; // Middle 50% (20-70%) - midfield area
    } else {
      return 'ATT'; // Top 20% (0-20%) - attacking area
    }
  }, []);

  const handlePlayerPositionChange = useCallback((playerId, position) => {
    if (position && position.clear) {
      setPlayerPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[playerId];
        return newPositions;
      });
      return;
    }
    
    if (position && typeof position.x === 'number' && typeof position.y === 'number') {
      // Determine position based on Y coordinates (vertical field reading)
      const fieldPosition = getPositionFromCoordinates(position.x, position.y);
      
      setPlayerPositions(prev => ({
        ...prev,
        [playerId]: {
          x: position.x,
          y: position.y,
          position: fieldPosition,
          isStarter: true
        }
      }));
    } else if (position && position.position) {
      // Handle direct position assignment (e.g., when manually setting position)
      setPlayerPositions(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          position: position.position,
          isStarter: true
        }
      }));
    }
  }, [getPositionFromCoordinates]);

  const clearPositions = useCallback(() => {
    setPlayerPositions({});
  }, []);

  const movePlayerToBench = useCallback((playerId) => {
    setPlayerPositions(prev => ({
      ...prev,
      [playerId]: {
        position: prev[playerId]?.position || 'SUB',
        x: undefined,
        y: undefined,
        isStarter: false
      }
    }));
  }, []);

  const movePlayerToField = useCallback((playerId, position = 'MID') => {
    // Find an available field position or assign a default one
    const defaultPositions = {
      'GK': { x: 50, y: 10 },
      'DEF': { x: 50, y: 30 },
      'MID': { x: 50, y: 50 },
      'ATT': { x: 50, y: 70 }
    };
    
    const fieldPos = defaultPositions[position] || defaultPositions['MID'];
    
    setPlayerPositions(prev => ({
      ...prev,
      [playerId]: {
        position: position,
        x: fieldPos.x,
        y: fieldPos.y,
        isStarter: true
      }
    }));
  }, []);

  const benchPlayers = Object.keys(playerPositions).filter(playerId => 
    playerPositions[playerId]?.isStarter === false
  );

  return {
    selectedFormation,
    playerPositions,
    getFormationSuggestions,
    handleFormationSelect,
    handlePlayerPositionChange,
    clearPositions,
    setSelectedFormation,
    setPlayerPositions,
    movePlayerToBench,
    movePlayerToField,
    benchPlayers
  };
};
