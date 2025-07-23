import { useState, useCallback } from 'react';
import axios from 'axios';

export const usePlayerSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadInitialPlayers = useCallback(async (sportFilter = null, positionFilter = null) => {
    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const params = { limit: 20 };
      
      if (sportFilter) params.sport = sportFilter;
      if (positionFilter) params.position = positionFilter;
      
      const response = await axios.get('http://localhost:5004/api/teams/search/available-players', {
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        params
      });
      
      let players = response.data.players || response.data || [];
      console.log('Raw API response:', response.data);
      console.log('Extracted players array:', players);
      
      if (!Array.isArray(players)) {
        console.log('Players is not an array, searching for arrays in response...');
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          players = possibleArrays[0];
          console.log('Found array:', players);
        } else {
          players = [];
        }
      }
      
      players = players.filter(player => 
        player && 
        (player._id || player.id) && 
        (player.fullName || player.name || player.email)
      );
      
      console.log('Filtered players for initial load:', players);
      players.forEach((player, index) => {
        console.log(`Player ${index}:`, {
          id: player._id || player.id,
          fullName: player.fullName,
          name: player.name,
          username: player.username,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email
        });
      });
      
      // Debug: Log the first few players to see the data structure
      console.log('Available players from loadInitialPlayers - First 3 players:', players.slice(0, 3));
      players.forEach((player, index) => {
        if (index < 3) {
          console.log(`Player ${index} structure:`, {
            id: player._id || player.id,
            fullName: player.fullName,
            name: player.name,
            username: player.username,
            firstName: player.firstName,
            lastName: player.lastName,
            email: player.email
          });
        }
      });
      
      setAvailablePlayers(players);
    } catch (error) {
      console.error('Error loading initial players:', error);
      setAvailablePlayers([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedSport, selectedPosition]);

  const searchPlayers = useCallback(async (query, sportFilter = selectedSport, positionFilter = selectedPosition) => {
    if (!query.trim()) {
      loadInitialPlayers(sportFilter, positionFilter);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const params = { q: query };
      
      if (sportFilter) params.sport = sportFilter;
      if (positionFilter) params.position = positionFilter;
      
      const response = await axios.get('http://localhost:5004/api/teams/search/players', {
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        params
      });
      
      let players = response.data.players || response.data || [];
      console.log('Search API response:', response.data);
      console.log('Search extracted players array:', players);
      
      if (!Array.isArray(players)) {
        console.log('Search players is not an array, searching for arrays in response...');
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          players = possibleArrays[0];
          console.log('Search found array:', players);
        } else {
          players = [];
        }
      }
      
      players = players.filter(player => 
        player && 
        (player._id || player.id) && 
        (player.fullName || player.name || player.email)
      );
      
      console.log('Search filtered players:', players);
      players.forEach((player, index) => {
        console.log(`Search Player ${index}:`, {
          id: player._id || player.id,
          fullName: player.fullName,
          name: player.name,
          username: player.username,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email
        });
      });
      
      setAvailablePlayers(players);
    } catch (error) {
      console.error('Error searching players:', error);
      setAvailablePlayers([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedSport, selectedPosition, loadInitialPlayers]);

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    if (!query.trim()) {
      window.searchTimeout = setTimeout(() => {
        loadInitialPlayers(selectedSport, selectedPosition);
      }, 100);
      return;
    }
    
    window.searchTimeout = setTimeout(() => {
      searchPlayers(query, selectedSport, selectedPosition);
    }, 500);
  }, [loadInitialPlayers, searchPlayers, selectedSport, selectedPosition]);

  const handleSportFilter = useCallback((sport) => {
    setSelectedSport(sport);
    if (searchQuery.trim()) {
      searchPlayers(searchQuery, sport, selectedPosition);
    } else {
      loadInitialPlayers(sport, selectedPosition);
    }
  }, [searchQuery, selectedPosition, searchPlayers, loadInitialPlayers]);

  const handlePositionFilter = useCallback((position) => {
    setSelectedPosition(position);
    if (searchQuery.trim()) {
      searchPlayers(searchQuery, selectedSport, position);
    } else {
      loadInitialPlayers(selectedSport, position);
    }
  }, [searchQuery, selectedSport, searchPlayers, loadInitialPlayers]);

  return {
    searchQuery,
    selectedSport,
    selectedPosition,
    availablePlayers,
    isSearching,
    handleSearchChange,
    handleSportFilter,
    handlePositionFilter,
    loadInitialPlayers,
    searchPlayers
  };
};
