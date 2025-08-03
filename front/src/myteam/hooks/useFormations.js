import { useState, useCallback } from 'react';

export const useFormations = () => {
  const [selectedFormation, setSelectedFormation] = useState('');
  const [playerPositions, setPlayerPositions] = useState({});

  const getFormationSuggestions = useCallback((playerCount) => {
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
      ]
    };
    return formations[playerCount] || [];
  }, []);

  const getFieldPositions = useCallback((formation, playerCount) => {
    const positions = {
      5: {
        '1-2-2': [
          { x: 10, y: 50, position: 'GK' },
          { x: 35, y: 25, position: 'DEF' },
          { x: 35, y: 75, position: 'DEF' },
          { x: 70, y: 30, position: 'ATT' },
          { x: 70, y: 70, position: 'ATT' }
        ],
        '1-3-1': [
          { x: 10, y: 50, position: 'GK' },
          { x: 40, y: 25, position: 'MID' },
          { x: 40, y: 50, position: 'MID' },
          { x: 40, y: 75, position: 'MID' },
          { x: 75, y: 50, position: 'ATT' }
        ],
        '1-1-3': [
          { x: 10, y: 50, position: 'GK' },
          { x: 30, y: 50, position: 'DEF' },
          { x: 70, y: 25, position: 'ATT' },
          { x: 70, y: 50, position: 'ATT' },
          { x: 70, y: 75, position: 'ATT' }
        ]
      },
      6: {
        '1-2-3': [
          { x: 10, y: 50, position: 'GK' },
          { x: 30, y: 30, position: 'DEF' },
          { x: 30, y: 70, position: 'DEF' },
          { x: 70, y: 20, position: 'ATT' },
          { x: 70, y: 50, position: 'ATT' },
          { x: 70, y: 80, position: 'ATT' }
        ],
        '1-3-2': [
          { x: 10, y: 50, position: 'GK' },
          { x: 40, y: 25, position: 'MID' },
          { x: 40, y: 50, position: 'MID' },
          { x: 40, y: 75, position: 'MID' },
          { x: 75, y: 35, position: 'ATT' },
          { x: 75, y: 65, position: 'ATT' }
        ],
        '1-4-1': [
          { x: 10, y: 50, position: 'GK' },
          { x: 35, y: 20, position: 'MID' },
          { x: 35, y: 40, position: 'MID' },
          { x: 35, y: 60, position: 'MID' },
          { x: 35, y: 80, position: 'MID' },
          { x: 75, y: 50, position: 'ATT' }
        ]
      }
    };
    return positions[playerCount]?.[formation] || [];
  }, []);

  const handleFormationSelect = useCallback((formation, selectedPlayers) => {
    setSelectedFormation(formation.name);
    const fieldPositions = getFieldPositions(formation.name, selectedPlayers.length);
    
    const newPositions = {};
    selectedPlayers.forEach((player, index) => {
      if (fieldPositions[index]) {
        newPositions[player._id || player.id] = {
          x: fieldPositions[index].x,
          y: fieldPositions[index].y,
          position: fieldPositions[index].position
        };
      }
    });
    setPlayerPositions(newPositions);
  }, [getFieldPositions]);

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
      setPlayerPositions(prev => ({
        ...prev,
        [playerId]: {
          x: position.x,
          y: position.y,
          position: prev[playerId]?.position || 'MID'
        }
      }));
    }
  }, []);

  const clearPositions = useCallback(() => {
    setPlayerPositions({});
  }, []);

  return {
    selectedFormation,
    playerPositions,
    getFormationSuggestions,
    handleFormationSelect,
    handlePlayerPositionChange,
    clearPositions,
    setSelectedFormation,
    setPlayerPositions
  };
};
