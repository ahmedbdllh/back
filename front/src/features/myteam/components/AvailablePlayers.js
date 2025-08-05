import React, { useState, useMemo } from 'react';
import { Users, Search as SearchIcon, UserPlus, Filter, ChevronDown } from 'lucide-react';
import PlayerList from './PlayerList';
import PlayerSearch from './PlayerSearch';

const AvailablePlayers = ({ 
  players,
  selectedPlayers,
  onAddPlayer,
  searchQuery,
  onSearchChange,
  isSearching,
  onSportFilter,
  onPositionFilter,
  selectedSport,
  selectedPosition
}) => {
  const [showFilters, setShowFilters] = useState(false);
  
  // Available sports and positions
  const sports = ['All Sports', 'Football', 'Basketball', 'Tennis', 'Paddle'];
  const positions = ['All Positions', 'Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
  
  // Filter players based on current filters
  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    
    // The backend now handles search filtering, so we only need to filter by sport and position on the client-side
    return players.filter(player => {
      const sportMatch = !selectedSport || selectedSport === 'All Sports' || 
                        player.preferredSports?.includes(selectedSport);
      const positionMatch = !selectedPosition || selectedPosition === 'All Positions' || 
                           player.position === selectedPosition;
      return sportMatch && positionMatch;
    });
  }, [players, selectedSport, selectedPosition]);

  const availablePlayersCount = filteredPlayers?.length || 0;
  const hasResults = availablePlayersCount > 0;
  const hasSearch = searchQuery && searchQuery.trim().length > 0;

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <Users size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Available Players</h3>
            <p className="text-sm text-white/60">
              {isSearching ? (
                "Searching..."
              ) : hasSearch ? (
                `${availablePlayersCount} result${availablePlayersCount !== 1 ? 's' : ''} found`
              ) : (
                `${availablePlayersCount} player${availablePlayersCount !== 1 ? 's' : ''} available`
              )}
            </p>
          </div>
        </div>
        
        {/* Quick Actions */}
        {hasResults && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showFilters 
                  ? 'text-blue-400 bg-blue-500/20' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Filter players"
            >
              <Filter size={16} />
            </button>
            <div className="w-px h-6 bg-white/20"></div>
            <span className="text-xs text-white/40 px-2 py-1 bg-white/5 rounded-full">
              {selectedPlayers?.length || 0} selected
            </span>
          </div>
        )}
      </div>

      {/* Enhanced Search Component */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-xl opacity-50"></div>
        <div className="relative bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <SearchIcon size={18} className="text-blue-400" />
            <span className="text-sm font-medium text-white">Find Players</span>
          </div>
          <PlayerSearch
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            isSearching={isSearching}
          />
          
          {/* Sport and Position Filters */}
          {showFilters && (
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sport Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Sport</label>
                  <div className="relative">
                    <select
                      value={selectedSport || 'All Sports'}
                      onChange={(e) => onSportFilter && onSportFilter(e.target.value === 'All Sports' ? null : e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    >
                      {sports.map(sport => (
                        <option key={sport} value={sport} className="bg-gray-800 text-white">
                          {sport}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" />
                  </div>
                </div>

                {/* Position Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Position</label>
                  <div className="relative">
                    <select
                      value={selectedPosition || 'All Positions'}
                      onChange={(e) => onPositionFilter && onPositionFilter(e.target.value === 'All Positions' ? null : e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    >
                      {positions.map(position => (
                        <option key={position} value={position} className="bg-gray-800 text-white">
                          {position}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* Active Filters Display */}
              {(selectedSport || selectedPosition) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-white/60">Active filters:</span>
                  {selectedSport && selectedSport !== 'All Sports' && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                      {selectedSport}
                      <button 
                        onClick={() => onSportFilter && onSportFilter(null)}
                        className="hover:text-blue-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedPosition && selectedPosition !== 'All Positions' && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
                      {selectedPosition}
                      <button 
                        onClick={() => onPositionFilter && onPositionFilter(null)}
                        className="hover:text-green-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Players List Section */}
      <div className="relative">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-purple-400 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium mb-1">Searching for players...</p>
              <p className="text-white/60 text-sm">Please wait while we find the best matches</p>
            </div>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl">
              <Users size={48} className="text-white/40" />
            </div>
            <div className="text-center max-w-sm">
              {hasSearch ? (
                <>
                  <h4 className="text-white font-medium mb-2">No players found</h4>
                  <p className="text-white/60 text-sm">
                    We couldn't find any players matching "<span className="text-blue-400 font-medium">{searchQuery}</span>". 
                    Try adjusting your search terms.
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-white font-medium mb-2">No players available</h4>
                  <p className="text-white/60 text-sm">
                    There are no players available at the moment. Check back later or invite new players to join.
                  </p>
                </>
              )}
            </div>
            {hasSearch && (
              <button
                onClick={() => onSearchChange('')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-green-400" />
                <span className="text-sm font-medium text-white">
                  {hasSearch ? 'Search Results' : 'All Players'}
                </span>
              </div>
              {hasSearch && (
                <button
                  onClick={() => onSearchChange('')}
                  className="text-xs text-white/60 hover:text-white px-3 py-1 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                  Show all
                </button>
              )}
            </div>

            {/* Players List with Enhanced Container */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <PlayerList
                players={filteredPlayers || []}
                onAddPlayer={onAddPlayer}
                selectedPlayers={selectedPlayers}
                searchQuery={searchQuery}
                isSearching={isSearching}
                isDraggable={false}
              />
            </div>

            {/* Footer Stats */}
            {hasResults && (
              <div className="flex items-center justify-between px-2 pt-2 border-t border-white/10">
                <div className="text-xs text-white/60">
                  Showing {availablePlayersCount} of {players?.length || 0} players
                  {(selectedSport || selectedPosition) && " (filtered)"}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {hasSearch && (
                    <span className="text-blue-400">
                      Search: "{searchQuery}"
                    </span>
                  )}
                  {(selectedSport || selectedPosition) && (
                    <button
                      onClick={() => {
                        onSportFilter && onSportFilter(null);
                        onPositionFilter && onPositionFilter(null);
                      }}
                      className="text-white/60 hover:text-white px-2 py-1 rounded-full hover:bg-white/10 transition-all duration-200"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailablePlayers;
