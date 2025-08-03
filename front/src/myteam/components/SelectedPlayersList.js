import React from 'react';
import PlayerCard from './PlayerCard';

const SelectedPlayersList = ({ 
  selectedPlayers, 
  onRemovePlayer, 
  playerPositions = {},
  showPositions = false 
}) => {
  if (selectedPlayers.length === 0) {
    return (
      <div className="bg-neutral-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-neutral-300 mb-2">Selected Players</h4>
        <p className="text-neutral-500 text-sm">No players selected yet</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <h4 className="text-sm font-medium text-neutral-300 mb-2">
        Selected Players ({selectedPlayers.length})
      </h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {selectedPlayers.map(player => {
          const playerId = player._id || player.id;
          const isPlaced = playerPositions[playerId] && 
                          playerPositions[playerId].x !== undefined && 
                          playerPositions[playerId].y !== undefined;

          return (
            <PlayerCard
              key={playerId}
              player={player}
              isSelected={true}
              onRemove={onRemovePlayer}
              isDraggable={!isPlaced}
              showPosition={showPositions}
              isPlaced={isPlaced}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SelectedPlayersList;
