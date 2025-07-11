import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';

export const usePlayerSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadInitialPlayers = useCallback(async () => {
    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/players', {
        headers: { 'x-auth-token': token },
        params: { limit: 20 }
      });
      
      let players = response.data;
      if (!Array.isArray(players)) {
        players = players.players || players.data || [];
        if (!Array.isArray(players)) {
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            players = possibleArrays[0];
          }
        }
      }
      
      players = players.filter(player => 
        player && 
        (player._id || player.id) && 
        (player.fullName || player.name || player.email)
      );
      
      setAvailablePlayers(players);
    } catch (error) {
      console.error('Error loading initial players:', error);
      setAvailablePlayers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchPlayers = useCallback(async (query) => {
    if (!query.trim()) {
      loadInitialPlayers();
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/players/search', {
        headers: { 'x-auth-token': token },
        params: { q: query }
      });
      
      let players = response.data;
      if (!Array.isArray(players)) {
        players = players.players || players.data || [];
        if (!Array.isArray(players)) {
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            players = possibleArrays[0];
          }
        }
      }
      
      players = players.filter(player => 
        player && 
        (player._id || player.id) && 
        (player.fullName || player.name || player.email)
      );
      
      setAvailablePlayers(players);
    } catch (error) {
      console.error('Error searching players:', error);
      setAvailablePlayers([]);
    } finally {
      setIsSearching(false);
    }
  }, [loadInitialPlayers]);

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    if (!query.trim()) {
      window.searchTimeout = setTimeout(() => {
        loadInitialPlayers();
      }, 100);
      return;
    }
    
    window.searchTimeout = setTimeout(() => {
      searchPlayers(query);
    }, 500);
  }, [loadInitialPlayers, searchPlayers]);

  return {
    searchQuery,
    availablePlayers,
    isSearching,
    handleSearchChange,
    loadInitialPlayers,
    searchPlayers
  };
};
