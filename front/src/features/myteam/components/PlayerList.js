import React from 'react';
import { Users, UserPlus } from 'lucide-react';
import PlayerCard from './PlayerCard';

const PlayerList = ({ 
  players, 
  selectedPlayers, 
  onAddPlayer, 
  onRemovePlayer, 
  isSearching,
  searchQuery,
  isDraggable = true
}) => {
  // Filter players for non-draggable lists (show only unselected players)
  const filteredPlayers = !isDraggable 
    ? players.filter(player => {
        const playerId = player._id || player.id;
        return !selectedPlayers.find(p => (p._id || p.id) === playerId);
      })
    : players;

  // Early returns for special states are handled by parent AvailablePlayers component
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-white/60 text-sm">Searching...</p>
        </div>
      </div>
    );
  }

  if (filteredPlayers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="p-3 bg-white/5 rounded-xl mb-3">
            <Users size={24} className="text-white/40" />
          </div>
          <p className="text-white/60 text-sm">
            {searchQuery ? 'No players found' : 'No players available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <UserPlus size={14} className="text-blue-400" />
          <span className="text-white/80">
            {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
          </span>
        </div>
        {!isDraggable && (
          <span className="text-white/60 text-xs">
            Click to add
          </span>
        )}
      </div>

      {/* Players Grid */}
      <div className="grid gap-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
        {filteredPlayers.map((player) => (
          <PlayerCard
            key={player._id || player.id}
            player={player}
            onAdd={onAddPlayer}
            onRemove={onRemovePlayer}
            isSelected={selectedPlayers?.some(p => 
              (p._id || p.id) === (player._id || player.id)
            )}
            isDraggable={isDraggable}
            compact={true}
          />
        ))}
      </div>

      {/* Footer info */}
      {filteredPlayers.length > 6 && (
        <div className="text-center pt-2 border-t border-white/10">
          <p className="text-xs text-white/60">
            Scroll to see more players
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
