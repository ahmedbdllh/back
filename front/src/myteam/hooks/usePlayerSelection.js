import { useState, useCallback } from 'react';

export const usePlayerSelection = () => {
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  const addPlayer = useCallback((player) => {
    const playerId = player._id || player.id;
    setSelectedPlayers(prev => {
      if (!prev.find(p => (p._id || p.id) === playerId)) {
        return [...prev, player];
      }
      return prev;
    });
  }, []);

  const removePlayer = useCallback((playerId) => {
    setSelectedPlayers(prev => prev.filter(p => (p._id || p.id) !== playerId));
  }, []);

  const clearSelectedPlayers = useCallback(() => {
    setSelectedPlayers([]);
  }, []);

  return {
    selectedPlayers,
    addPlayer,
    removePlayer,
    clearSelectedPlayers,
    setSelectedPlayers
  };
};
