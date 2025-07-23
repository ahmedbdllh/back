import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddPlayerModal = ({ 
  isOpen, 
  onClose, 
  teamId, 
  teamSport,
  currentMembers = [],
  maxMembers = 8,
  onPlayerAdded 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const availableSlots = maxMembers - currentMembers.length;

  // Search for available players
  const searchPlayers = async (query = '') => {
    if (!teamId) return;
    
    setIsSearching(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (query.trim()) {
        params.append('q', query.trim());
      }
      if (teamSport) {
        params.append('sport', teamSport);
      }
      params.append('excludeTeamId', teamId);
      params.append('limit', '20');
      
      const response = await axios.get(
        `http://localhost:5004/api/teams/search/available-players?${params.toString()}`,
        {
          headers: { 'x-auth-token': token }
        }
      );
      
      // Filter out players who are already team members
      const currentMemberIds = currentMembers.map(member => member.userId || member._id);
      const filteredResults = (response.data.players || []).filter(
        player => !currentMemberIds.includes(player._id)
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching players:', err);
      setError('Failed to search players. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Load initial players when modal opens
  useEffect(() => {
    if (isOpen) {
      searchPlayers();
      setSelectedPlayers([]);
      setSearchQuery('');
      setError('');
    }
  }, [isOpen, teamId]);

  // Handle search input changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (isOpen) {
        searchPlayers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, isOpen]);

  const handlePlayerSelect = (player) => {
    const isSelected = selectedPlayers.find(p => p._id === player._id);
    
    if (isSelected) {
      setSelectedPlayers(prev => prev.filter(p => p._id !== player._id));
    } else {
      if (selectedPlayers.length >= availableSlots) {
        setError(`You can only add ${availableSlots} more player(s) to this team.`);
        return;
      }
      setSelectedPlayers(prev => [...prev, player]);
      setError('');
    }
  };

  const handleAddPlayers = async () => {
    if (selectedPlayers.length === 0) {
      setError('Please select at least one player to add.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const playerIds = selectedPlayers.map(player => player._id);
      
      const response = await axios.post(
        `http://localhost:5004/api/teams/${teamId}/invite`,
        { playerIds },
        {
          headers: { 'x-auth-token': token }
        }
      );

      if (response.data) {
        onPlayerAdded && onPlayerAdded(selectedPlayers);
        onClose();
      }
    } catch (err) {
      console.error('Error adding players:', err);
      setError(err.response?.data?.error || 'Failed to add players. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden border border-neutral-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Add Players to Team</h2>
            <p className="text-neutral-400 text-sm">
              Available slots: {availableSlots} / {maxMembers} players
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-neutral-700 hover:bg-neutral-600 rounded-xl flex items-center justify-center transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search players by name..."
              className="w-full bg-neutral-800 text-white px-4 py-3 pl-12 rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex gap-6 h-96">
          {/* Available Players */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-4">Available Players</h3>
            <div className="bg-neutral-800/50 rounded-xl p-4 h-full overflow-y-auto border border-neutral-700">
              {isSearching ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-neutral-400">
                  <p>No available players found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((player) => {
                    const isSelected = selectedPlayers.find(p => p._id === player._id);
                    return (
                      <div
                        key={player._id}
                        onClick={() => handlePlayerSelect(player)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-sky-500/20 border border-sky-400'
                            : 'bg-neutral-700/50 hover:bg-neutral-600/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{player.fullName || player.name || 'Unknown Player'}</p>
                            <p className="text-neutral-400 text-sm">{player.email}</p>
                            {player.position && (
                              <p className="text-sky-400 text-sm">{player.position}</p>
                            )}
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'bg-sky-400 border-sky-400' : 'border-neutral-500'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected Players */}
          <div className="w-80">
            <h3 className="text-lg font-semibold text-white mb-4">
              Selected Players ({selectedPlayers.length})
            </h3>
            <div className="bg-neutral-800/50 rounded-xl p-4 h-full overflow-y-auto border border-neutral-700">
              {selectedPlayers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-neutral-400">
                  <p>No players selected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedPlayers.map((player) => (
                    <div
                      key={player._id}
                      className="p-3 bg-neutral-700/50 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-medium">{player.fullName || player.name}</p>
                        <p className="text-neutral-400 text-sm">{player.email}</p>
                      </div>
                      <button
                        onClick={() => handlePlayerSelect(player)}
                        className="w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center transition-colors duration-200"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-700">
          <p className="text-neutral-400 text-sm">
            {selectedPlayers.length > 0 && `Adding ${selectedPlayers.length} player(s)`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPlayers}
              disabled={selectedPlayers.length === 0 || isLoading}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Add {selectedPlayers.length > 0 ? `${selectedPlayers.length} ` : ''}Player{selectedPlayers.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPlayerModal;
