import React from 'react';
import PlayerCard from './PlayerCard';

const PlayerList = ({ 
  players, 
  selectedPlayers, 
  onAddPlayer, 
  onRemovePlayer, 
  isSearching,
  searchQuery 
}) => {
  if (isSearching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400 mx-auto mb-2"></div>
          <p className="text-neutral-400 text-sm">Searching players...</p>
        </div>
      </div>
    );
  }

  if (searchQuery && players.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-3">
            <svg className="w-12 h-12 mx-auto text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="text-neutral-400 text-sm">
            <p className="font-medium">No players found for "{searchQuery}"</p>
            <p className="text-xs mt-1">Try different search terms or check your spelling</p>
          </div>
        </div>
      </div>
    );
  }

  if (!searchQuery && players.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-3">
            <svg className="w-8 h-8 mx-auto text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m13.4-2.382a4 4 0 11-5.292 0M15 12a4 4 0 110-5.292" />
            </svg>
          </div>
          <div className="text-neutral-400 text-sm">
            <p className="font-medium">Loading players...</p>
            <p className="text-xs mt-1">Please wait while we fetch available players</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-neutral-300 mb-3 flex-shrink-0">
        {searchQuery ? `Search Results (${players.length})` : `Available Players (${players.length})`}
      </h4>
      <div 
        className="max-h-64 overflow-y-auto space-y-2 pr-2"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#0ea5e9 #404040' }}
      >
        {players.map(player => {
          const playerId = player._id || player.id;
          const isSelected = selectedPlayers.find(p => (p._id || p.id) === playerId);
          
          return (
            <PlayerCard
              key={playerId}
              player={player}
              isSelected={isSelected}
              onAdd={onAddPlayer}
              onRemove={onRemovePlayer}
              isDraggable={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PlayerList;
