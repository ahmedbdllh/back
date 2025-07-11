import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { AuthModal } from '../shared/ui/components/AuthModal'; // Import the modal
import StadiumField from '../components/StadiumField3D';
import Avatar from '../components/Avatar';

const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m13.4-2.382a4 4 0 11-5.292 0M15 12a4 4 0 110-5.292" /></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M19 3v4M17 5h4M14 11l-1.5-1.5L11 11l-1.5 1.5L11 14l1.5-1.5L14 14l1.5 1.5L17 14l-1.5-1.5L17 11l-1.5-1.5-1.5 1.5z" /></svg>;

const MyTeam = () => {
  // Add custom styles for smooth animations
  const customStyles = `
    .search-container {
      transition: all 0.3s ease-in-out;
    }
    
    .player-card {
      transform: translateY(0);
      transition: all 0.2s ease-in-out;
    }
    
    .player-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
    }
    
    .fade-in-up {
      animation: fadeInUp 0.3s ease-out forwards;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .loading-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }

    /* Football Field Styles */
    .football-field {
      background-image: url("/assets/football-field.jpg");
      background-color: #1a5a1e; /* Fallback for debugging */
      background-size: cover;
      background-position: center;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.6);
    }
    
    .player-on-field {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      cursor: grab;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transform: translate(-50%, -50%);
    }
    
    .player-on-field:hover {
      transform: translate(-50%, -50%) scale(1.1);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.5);
    }
    
    .player-on-field.dragging {
      cursor: grabbing;
      transform: translate(-50%, -50%) scale(1.1);
      z-index: 1000;
    }
    
    .draggable-player {
      cursor: grab;
      transition: all 0.2s ease;
    }
    
    .draggable-player:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }
    
    .draggable-player:active {
      cursor: grabbing;
      transform: scale(0.98);
      opacity: 0.8;
    }
    
    .draggable-player.dragging {
      cursor: grabbing;
      opacity: 0.5;
      transform: scale(0.95);
    }
    
    .formation-card {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .formation-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
    }
    
    .formation-card.selected {
      border-color: #0ea5e9;
      background-color: rgba(14, 165, 233, 0.1);
    }
    
    .position-badge {
      font-size: 8px;
      padding: 1px 4px;
      border-radius: 4px;
      background: rgba(0,0,0,0.7);
      color: white;
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
    }
  `;

  const [hasTeam, setHasTeam] = useState(false);
  const [team, setTeam] = useState(null);
  const [showJoinTeamInput, setShowJoinTeamInput] = useState(false);
  const [joinTeamCode, setJoinTeamCode] = useState('');
  
  // State for the creation modal
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);  const [modalStep, setModalStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [teamSport, setTeamSport] = useState('');
  const [error, setError] = useState('');
  
  // Player search state
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Position assignment state
  const [selectedFormation, setSelectedFormation] = useState('');
  const [playerPositions, setPlayerPositions] = useState({});
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [selectedPlayer3D, setSelectedPlayer3D] = useState(null);

  const fetchTeam = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await axios.get('http://localhost:5000/api/teams/my-team', {
          headers: { 'x-auth-token': token },
        });
        setTeam(res.data);
        setHasTeam(true);
      } catch (err) {
        setTeam(null);
        setHasTeam(false);
      }
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // Validation for football teams - positions are required
    if (teamSport === 'football' && selectedPlayers.length > 0) {
      const positionedPlayers = Object.keys(playerPositions).length;
      if (positionedPlayers === 0) {
        setError('Please assign positions to your players or select a formation.');
        return;
      }
      if (positionedPlayers < selectedPlayers.length) {
        setError(`Please assign positions to all ${selectedPlayers.length} selected players.`);
        return;
      }
    }
    
    try {
      // Create team with the collected data
      const teamData = {
        name: teamName,
        sport: teamSport,
        description: `A ${teamSport} team created by ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).fullName : 'Unknown'}`,
        selectedPlayers: selectedPlayers.map(player => player._id), // Include selected player IDs
      };
      
      // Only include formation and positions for football teams
      if (teamSport === 'football') {
        teamData.formation = selectedFormation;
        teamData.playerPositions = playerPositions;
      }
      
      const res = await axios.post('http://localhost:5003/api/teams', teamData, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
      });
      
      if (res.data.team) {
        setTeam(res.data.team);
        setHasTeam(true);
        resetModal();
        
        // TODO: Send invitations to selected players
        if (selectedPlayers.length > 0) {
          console.log('Team created! Invitations should be sent to:', selectedPlayers);
        }
      }
    } catch (err) {
      console.error('Error creating team:', err);
      setError(err.response?.data?.error || 'Failed to create team. Please try again.');
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://localhost:5000/api/teams/join', { joinCode: joinTeamCode }, {
        headers: { 'x-auth-token': token },
      });
      setTeam(res.data);
      setHasTeam(true);
    } catch (err) {
      alert(err.response.data.msg);
    }
  };

  const handleNextStep = () => {
    if (modalStep === 1) {
        if (!teamName.trim()) {
            setError('Please enter a team name.');
            return;
        }
        if (!teamSport) {
            setError('Please select a sport.');
            return;
        }
    }
    if (modalStep === 2) {
        if (selectedPlayers.length === 0) {
            setError('Please select at least one player.');
            return;
        }
        // For non-football sports, we can skip position assignment or make it optional
        if (teamSport !== 'football') {
            // You can either skip step 3 entirely or make positions optional
            // For now, we'll still show step 3 but make it optional
        }
    }
    setError('');
    setModalStep(prev => prev + 1);
    
    // When moving to step 2 (player selection), load initial players
    if (modalStep === 1) {
      loadInitialPlayers();
    }
  };

  const handleBackStep = () => {
      setModalStep(prev => prev - 1);
  }
  const resetModal = () => {
    setShowCreateTeamModal(false);
    setModalStep(1);
    setTeamName('');
    setTeamSport('');
    setError('');
    // Reset player search state
    setSearchQuery('');
    setAvailablePlayers([]);
    setSelectedPlayers([]);
    setIsSearching(false);
    // Reset position assignment state
    setSelectedFormation('');
    setPlayerPositions({});
    setDraggedPlayer(null);
    setSelectedPlayer3D(null);
  }

  const progressPercentage = (modalStep / 3) * 100;

  // Load initial players when step 2 opens
  const loadInitialPlayers = async () => {
    setIsSearching(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/players`, {
        headers: { 'x-auth-token': token },
        params: {
          limit: 20, // Load first 20 players initially
          page: 1
        }
      });
      
      console.log('Initial players response:', response.data);
      
      // Handle different possible response structures
      let players = [];
      if (response.data && response.data.success) {
        players = response.data.data || response.data.players || [];
      } else if (response.data && response.data.players) {
        players = response.data.players;
      } else if (Array.isArray(response.data)) {
        players = response.data;
      } else if (response.data) {
        // Try to extract array from any field that might contain players
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          players = possibleArrays[0];
        }
      }
      
      // Filter out any invalid entries and ensure we have valid player data
      players = players.filter(player => 
        player && 
        (player._id || player.id) && 
        (player.fullName || player.name || player.email)
      );
      
      console.log(`Loaded ${players.length} initial players`);
      setAvailablePlayers(players);
      
    } catch (error) {
      console.error('Error loading initial players:', error);
      setAvailablePlayers([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Search for players
  const searchPlayers = async (query) => {
    if (!query.trim()) {
      setAvailablePlayers([]);
      return;
    }
    
    setIsSearching(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/players`, {
        headers: { 'x-auth-token': token },
        params: {
          search: query,
          // Remove sport filter to get more results
          // sport: teamSport,
          limit: 100, // Increase limit to show more players
          page: 1
        }
      });
      
      console.log('Players search response:', response.data); // Debug log
      
      // Handle different possible response structures
      let players = [];
      if (response.data && response.data.success) {
        players = response.data.data || response.data.players || [];
      } else if (response.data && response.data.players) {
        players = response.data.players;
      } else if (Array.isArray(response.data)) {
        players = response.data;
      } else if (response.data) {
        // Try to extract array from any field that might contain players
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          players = possibleArrays[0];
        }
      }
      
      // Filter out any invalid entries and ensure we have valid player data
      players = players.filter(player => 
        player && 
        (player._id || player.id) && 
        (player.fullName || player.name || player.email)
      );
      
      console.log('Processed players:', players); // Debug log
      console.log(`Found ${players.length} valid players`); // Debug log
      setAvailablePlayers(players);
      
    } catch (error) {
      console.error('Error searching players:', error);
      console.error('Error details:', error.response?.data); // More detailed error logging
      setAvailablePlayers([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing and stable state management
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear existing timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // If query is empty, don't clear immediately to prevent flickering
    // Instead, load initial players again
    if (!query.trim()) {
      window.searchTimeout = setTimeout(() => {
        loadInitialPlayers();
      }, 100);
      return;
    }
    
    // Debounce search with longer delay for stability
    window.searchTimeout = setTimeout(() => {
      searchPlayers(query);
    }, 500);
  };

  // Memoize player rendering for better performance
  const renderPlayerList = useMemo(() => {
    return availablePlayers.map(player => {
      const isSelected = selectedPlayers.find(p => (p._id || p.id) === (player._id || player.id));
      const playerName = player.fullName || player.name || 'Unknown Player';
      const playerEmail = player.email || 'No email';
      
      const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'player',
          player: player
        }));
        e.dataTransfer.effectAllowed = 'copy';
        
        // Add visual feedback
        e.currentTarget.classList.add('dragging');
      };
      
      const handleDragEnd = (e) => {
        // Remove visual feedback
        e.currentTarget.classList.remove('dragging');
      };
      
      return (
        <div 
          key={player._id || player.id} 
          className={`player-card draggable-player flex justify-between items-center rounded-lg p-3 transition-all duration-200 ${
            isSelected ? 'bg-sky-500/20 border border-sky-500/50' : 'bg-neutral-700 hover:bg-neutral-600'
          }`} 
          style={{ minHeight: '76px' }}
          draggable={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              {player.profileImage && player.profileImage.startsWith('http') ? (
                <img 
                  src={player.profileImage}
                  alt={playerName} 
                  className="w-full h-full rounded-full border-2 border-sky-400 object-cover"
                  style={{ 
                    backgroundColor: '#404040',
                    minWidth: '40px', 
                    minHeight: '40px'
                  }}
                  onError={(e) => {
                    // Hide the broken image and show avatar fallback
                    e.target.style.display = 'none';
                    const avatarFallback = e.target.nextElementSibling;
                    if (avatarFallback) {
                      avatarFallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <Avatar 
                name={playerName}
                size={40}
                className="border-2 border-sky-400"
                style={{ 
                  display: player.profileImage && player.profileImage.startsWith('http') ? 'none' : 'flex'
                }}
              />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{playerName}</p>
              <p className="text-neutral-400 text-xs">{playerEmail}</p>
              {(player.preferredSports || player.preferredSport) && (
                <p className="text-sky-400 text-xs">
                  {player.preferredSports 
                    ? (Array.isArray(player.preferredSports) 
                        ? player.preferredSports.join(', ') 
                        : player.preferredSports)
                    : player.preferredSport}
                </p>
              )}
              {player.position && (
                <p className="text-green-400 text-xs">Position: {player.position}</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => isSelected ? removePlayer(player._id || player.id) : addPlayer(player)}
            className={`text-xs font-bold py-1 px-3 rounded-lg transition-colors duration-200 ${
              isSelected 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-sky-500 hover:bg-sky-600 text-white'
            }`}
          >
            {isSelected ? 'Remove' : 'Add'}
          </button>
        </div>
      );
    });
  }, [availablePlayers, selectedPlayers]);

  // Remove player from selected list
  const removePlayer = useCallback((playerId) => {
    setSelectedPlayers(prev => prev.filter(p => (p._id || p.id) !== playerId));
  }, []);

  // Add player to selected list
  const addPlayer = useCallback((player) => {
    const playerId = player._id || player.id;
    setSelectedPlayers(prev => {
      if (!prev.find(p => (p._id || p.id) === playerId)) {
        return [...prev, player];
      }
      return prev;
    });
  }, []);

  // Formation suggestions based on number of players
  const getFormationSuggestions = (playerCount) => {
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
  };

  // Get field positions based on formation and field size
  const getFieldPositions = (formation, playerCount) => {
    const positions = {
      5: {
        '1-2-2': [
          { x: 10, y: 50, position: 'GK' },   // Goalkeeper
          { x: 35, y: 25, position: 'DEF' },  // Left defender
          { x: 35, y: 75, position: 'DEF' },  // Right defender
          { x: 70, y: 30, position: 'ATT' },  // Left attacker
          { x: 70, y: 70, position: 'ATT' }   // Right attacker
        ],
        '1-3-1': [
          { x: 10, y: 50, position: 'GK' },   // Goalkeeper
          { x: 40, y: 25, position: 'MID' },  // Left midfielder
          { x: 40, y: 50, position: 'MID' },  // Center midfielder
          { x: 40, y: 75, position: 'MID' },  // Right midfielder
          { x: 75, y: 50, position: 'ATT' }   // Striker
        ],
        '1-1-3': [
          { x: 10, y: 50, position: 'GK' },   // Goalkeeper
          { x: 30, y: 50, position: 'DEF' },  // Center defender
          { x: 70, y: 25, position: 'ATT' },  // Left attacker
          { x: 70, y: 50, position: 'ATT' },  // Center attacker
          { x: 70, y: 75, position: 'ATT' }   // Right attacker
        ]
      },
      6: {
        '1-2-3': [
          { x: 10, y: 50, position: 'GK' },   // Goalkeeper
          { x: 30, y: 30, position: 'DEF' },  // Left defender
          { x: 30, y: 70, position: 'DEF' },  // Right defender
          { x: 70, y: 20, position: 'ATT' },  // Left attacker
          { x: 70, y: 50, position: 'ATT' },  // Center attacker
          { x: 70, y: 80, position: 'ATT' }   // Right attacker
        ],
        '1-3-2': [
          { x: 10, y: 50, position: 'GK' },   // Goalkeeper
          { x: 40, y: 25, position: 'MID' },  // Left midfielder
          { x: 40, y: 50, position: 'MID' },  // Center midfielder
          { x: 40, y: 75, position: 'MID' },  // Right midfielder
          { x: 75, y: 35, position: 'ATT' },  // Left attacker
          { x: 75, y: 65, position: 'ATT' }   // Right attacker
        ],
        '1-4-1': [
          { x: 10, y: 50, position: 'GK' },   // Goalkeeper
          { x: 35, y: 20, position: 'MID' },  // Left midfielder
          { x: 35, y: 40, position: 'MID' },  // Center-left midfielder
          { x: 35, y: 60, position: 'MID' },  // Center-right midfielder
          { x: 35, y: 80, position: 'MID' },  // Right midfielder
          { x: 75, y: 50, position: 'ATT' }   // Striker
        ]
      }
    };
    return positions[playerCount]?.[formation] || [];
  };

  // Handle formation selection
  const handleFormationSelect = (formation) => {
    setSelectedFormation(formation.name);
    const fieldPositions = getFieldPositions(formation.name, selectedPlayers.length);
    
    // Auto-assign players to positions if they haven't been assigned yet
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
  };

  // Handle drag and drop
  const handleDragStart = (player) => {
    setDraggedPlayer(player);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggedPlayer) return;
    
    const field = e.currentTarget;
    const rect = field.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Ensure position is within field bounds
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));
    
    setPlayerPositions(prev => ({
      ...prev,
      [draggedPlayer._id || draggedPlayer.id]: {
        x: clampedX,
        y: clampedY,
        position: prev[draggedPlayer._id || draggedPlayer.id]?.position || 'MID'
      }
    }));
    
    setDraggedPlayer(null);
  };

  return (
    <React.Fragment>
      <style>{customStyles}</style>
      <div className="bg-neutral-900 min-h-screen text-white p-8">
      <div className="container mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-sky-400">My Team</h1>
          <p className="text-neutral-400">
            {hasTeam ? `Managing ${team?.name}` : "You don't have a team yet. Create one or join an existing one."}
          </p>
        </header>

        {hasTeam && team ? (
          <div className="bg-neutral-800 shadow-lg rounded-lg p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Team Members</h2>
              <div className="text-right">
                <p className="text-neutral-400">Join Code:</p>
                <p className="text-sky-400 font-mono p-2 bg-neutral-700 rounded">{team.joinCode}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {team.members.map((member) => (
                <div key={member._id} className="bg-neutral-700 rounded-lg p-4 flex flex-col items-center text-center shadow-md hover:shadow-sky-500/20 transition-shadow duration-300">
                  <img src={member.profileImage ? `http://localhost:5000${member.profileImage}` : 'https://i.pravatar.cc/150?u=a042581f4e29026704d'} alt={member.fullName} className="w-24 h-24 rounded-full mb-4 border-2 border-sky-400" />
                  <h3 className="text-xl font-semibold">{member.fullName}</h3>
                  <p className="text-neutral-400">{team.captain === member._id ? 'Captain' : 'Player'}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-neutral-800 shadow-lg rounded-lg p-12 animate-fadeIn">
              <h2 className="text-2xl font-semibold mb-4">No Team Found</h2>
              <p className="text-neutral-400 mb-8">It looks like you're not part of a team yet. <br /> You can create a new team or join an existing one.</p>
              
              {showJoinTeamInput ? (
                <form onSubmit={handleJoinTeam} className="flex flex-col items-center space-y-4">
                    <input 
                        type="text"
                        value={joinTeamCode}
                        onChange={(e) => setJoinTeamCode(e.target.value)}
                        placeholder="Enter Team Code"
                        className="bg-neutral-700 text-white px-4 py-2 rounded-md w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <div className="flex space-x-4">
                        <button 
                            type="submit"
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                        >
                            Join
                        </button>
                        <button 
                            onClick={() => setShowJoinTeamInput(false)}
                            className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                    <div className="flex justify-center items-center space-x-4">
                        <button 
                        type="button"
                        onClick={() => setShowCreateTeamModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-lg shadow-lg hover:shadow-green-500/30"
                        >
                        Create Your Team
                        </button>
                        <button 
                        type="button"
                        onClick={() => setShowJoinTeamInput(true)}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-lg shadow-lg hover:shadow-sky-500/30"
                        >
                        Join a Team
                        </button>
                    </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>      <AuthModal isOpen={showCreateTeamModal} onClose={resetModal} maxWidth={modalStep === 3 ? "max-w-6xl" : "max-w-lg"}>        <div className="text-white rounded-lg shadow-2xl bg-neutral-800 flex flex-col min-h-0 max-h-none overflow-visible">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-neutral-800 via-neutral-700 to-sky-600 p-6 relative flex-shrink-0">
                <button 
                    onClick={resetModal} 
                    className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors text-2xl font-light"
                >
                    ×
                </button>
                <div className="flex items-center space-x-3">
                    <div className="p-2">
                        <SparklesIcon />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Create Your Team</h2>
                        <p className="text-sm text-neutral-200">Let's build something amazing together</p>
                    </div>
                </div>
                
                {/* Progress section */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-medium text-neutral-200">Step {modalStep} of 3</p>
                        <p className="text-sm font-medium text-sky-300">{Math.round(progressPercentage)}% Complete</p>
                    </div>
                    <div className="w-full bg-neutral-600 rounded-full h-2">
                        <div className="bg-sky-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            </div>            {/* Body */}
            <div className="p-6 bg-neutral-900 flex-1 min-h-0">
                {error && <p className="text-red-500 text-center mb-4 animate-shake">{error}</p>}

                {modalStep === 1 && (
                    <div className="animate-fadeIn">                        <div className="text-center mb-6">
                            <div className="mx-auto bg-sky-500/20 rounded-full h-12 w-12 flex items-center justify-center mb-3">
                                <svg className="h-6 w-6 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Team Details</h3>
                            <p className="text-sm text-neutral-200">Give your team an identity that represents your spirit</p>
                        </div><div className="space-y-4">
                            <div>
                                <label htmlFor="teamName" className="block text-sm font-medium text-neutral-300 mb-2">Team Name</label>                                <input 
                                    type="text"
                                    id="teamName"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder=""
                                    className="bg-neutral-700 text-white px-4 py-2.5 rounded-lg w-full border-0"
                                    style={{ 
                                        outline: 'none !important',
                                        boxShadow: 'none !important',
                                        border: 'none !important'
                                    }}
                                />
                            </div>
                            <div>
                                <label htmlFor="teamSport" className="block text-sm font-medium text-neutral-300 mb-2">Sport</label>                                <select 
                                    id="teamSport" 
                                    value={teamSport} 
                                    onChange={(e) => setTeamSport(e.target.value)}
                                    className="bg-neutral-700 text-white px-4 py-2.5 rounded-lg w-full appearance-none border-0"
                                    style={{
                                        outline: 'none !important',
                                        boxShadow: 'none !important',
                                        border: 'none !important',
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.75rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.5em 1.5em'
                                    }}                                >
                                    <option value="" disabled>Select a sport</option>
                                    <option value="football">Football</option>
                                    <option value="basketball">Basketball</option>
                                    <option value="tennis">Tennis</option>
                                    <option value="paddle">Paddle</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {modalStep === 2 && (
                    <div className="animate-fadeIn">                        <div className="text-center mb-6">
                            <div className="mx-auto bg-sky-500/20 rounded-full h-12 w-12 flex items-center justify-center mb-3">
                                <svg className="h-6 w-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m13.4-2.382a4 4 0 11-5.292 0M15 12a4 4 0 110-5.292" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Team Members</h3>
                            <p className="text-neutral-400 text-sm">Invite your teammates to join the adventure</p>
                        </div>
                        <div className="space-y-4">
                          <div className="flex flex-col">
                            <label className="text-sm font-medium text-neutral-300 mb-2">Search Players</label>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="text" 
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search by name, email, or phone number..."
                                className="bg-neutral-700 text-white px-4 py-2 rounded-lg w-full border-0"
                                style={{ 
                                    outline: 'none !important',
                                    boxShadow: 'none !important',
                                    border: 'none !important'
                                }}
                              />
                              {isSearching && (
                                <div className="flex items-center space-x-1 text-sky-400">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
                                  <span className="text-xs">Searching...</span>
                                </div>
                              )}
                            </div>
                            {!searchQuery && availablePlayers.length > 0 && (
                              <p className="text-xs text-neutral-400 mt-1">
                                Showing available players. Type to search for specific players.
                              </p>
                            )}
                          </div>
                          
                          {/* Absolutely stable container with fixed dimensions */}
                          <div className="h-80 bg-neutral-800 rounded-lg overflow-hidden">
                            {/* Loading state overlay */}
                            {isSearching && (
                              <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center z-10">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400 mx-auto mb-2"></div>
                                  <p className="text-neutral-400 text-sm">Searching players...</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Content container with consistent padding */}
                            <div className="h-full p-4 flex flex-col">
                              {!isSearching && availablePlayers.length > 0 && (
                                <>
                                  <h4 className="text-sm font-medium text-neutral-300 mb-3 flex-shrink-0">
                                    {searchQuery ? `Search Results (${availablePlayers.length})` : `Available Players (${availablePlayers.length})`}
                                  </h4>
                                  <div className="flex-1 overflow-y-auto space-y-2 pr-2"
                                       style={{ scrollbarWidth: 'thin', scrollbarColor: '#0ea5e9 #404040' }}>
                                    {renderPlayerList}
                                  </div>
                                </>
                              )}
                              
                              {/* Show message when search returns no results */}
                              {!isSearching && searchQuery && availablePlayers.length === 0 && (
                                <div className="flex-1 flex items-center justify-center">
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
                              )}
                              
                              {/* Show message when no initial players loaded */}
                              {!isSearching && !searchQuery && availablePlayers.length === 0 && (
                                <div className="flex-1 flex items-center justify-center">
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
                              )}
                            </div>
                          </div>
                          
                          {selectedPlayers.length > 0 && (
                            <div className="bg-neutral-800 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-neutral-300 mb-2">Selected Players</h4>
                              <div className="space-y-2">
                                {selectedPlayers.map(player => {
                                  const playerName = player.fullName || player.name || 'Unknown Player';
                                  
                                  const handleDragStart = (e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                      type: 'player',
                                      player: player
                                    }));
                                    e.dataTransfer.effectAllowed = 'copy';
                                    
                                    // Add visual feedback
                                    e.currentTarget.classList.add('dragging');
                                  };
                                  
                                  const handleDragEnd = (e) => {
                                    // Remove visual feedback
                                    e.currentTarget.classList.remove('dragging');
                                  };
                                  
                                  // Enhanced image handling with multiple fallback options
                                  let profileImageUrl;
                                  
                                  return (
                                    <div 
                                      key={player._id || player.id} 
                                      className="draggable-player flex justify-between items-center bg-neutral-700 rounded-lg p-3"
                                      draggable={true}
                                      onDragStart={handleDragStart}
                                      onDragEnd={handleDragEnd}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className="relative w-10 h-10 flex-shrink-0">
                                          {player.profileImage && player.profileImage.startsWith('http') ? (
                                            <img 
                                              src={player.profileImage}
                                              alt={playerName} 
                                              className="w-full h-full rounded-full border-2 border-sky-400 object-cover"
                                              onError={(e) => {
                                                // Hide broken image and show avatar fallback
                                                e.target.style.display = 'none';
                                                const avatarFallback = e.target.nextElementSibling;
                                                if (avatarFallback) {
                                                  avatarFallback.style.display = 'flex';
                                                }
                                              }}
                                            />
                                          ) : null}
                                          <Avatar 
                                            name={playerName}
                                            size={40}
                                            className="border-2 border-sky-400"
                                            style={{ 
                                              display: player.profileImage && player.profileImage.startsWith('http') ? 'none' : 'flex'
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <p className="text-white text-sm font-medium">{playerName}</p>
                                          <p className="text-neutral-400 text-xs">{player.email || 'No email'}</p>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => removePlayer(player._id || player.id)}
                                        className="text-red-400 hover:text-red-500 text-xs font-bold transition-colors duration-300"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                )}

                {modalStep === 3 && (
                    <div className="animate-fadeIn">
                        <div className="text-center mb-6">
                            <div className="mx-auto bg-sky-500/20 rounded-full h-12 w-12 flex items-center justify-center mb-3">
                                <svg className="h-6 w-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Assign Positions</h3>
                            <p className="text-neutral-400 text-sm">Drag players onto the field or choose a formation</p>
                        </div>

                        {selectedPlayers.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-neutral-500">Please select players in the previous step to assign positions.</p>
                            </div>
                        ) : teamSport !== 'football' ? (
                            <div className="text-center py-8">
                                <div className="mb-4">
                                    <svg className="h-16 w-16 text-sky-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0114 0z" />
                                    </svg>
                                    <h4 className="text-lg font-medium text-white mb-2">Team Setup Complete!</h4>
                                    <p className="text-neutral-400 mb-4">
                                        Position assignment is currently available for football teams only.
                                        <br />Your {teamSport} team is ready to be created!
                                    </p>
                                    <div className="bg-neutral-700 rounded-lg p-4 max-w-md mx-auto">
                                        <h5 className="text-white font-medium mb-2">Selected Players ({selectedPlayers.length})</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedPlayers.map(player => {
                                                const playerName = player.fullName || player.name || 'Unknown Player';
                                                return (
                                                    <span key={player._id || player.id} className="text-xs px-2 py-1 bg-sky-600 rounded text-white">
                                                        {playerName}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column: Available Players */}
                                <div className="lg:col-span-1">
                                    <h4 className="text-sm font-medium text-neutral-300 mb-3">Selected Players</h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {selectedPlayers.map(player => {
                                          const playerName = player.fullName || player.name || 'Unknown Player';
                                          const playerId = player._id || player.id;
                                          const isPlaced = playerPositions[playerId] && playerPositions[playerId].x !== undefined && playerPositions[playerId].y !== undefined;

                                          const handleDragStart = (e) => {
                                            if (isPlaced) {
                                              e.preventDefault();
                                              return;
                                            }
                                            e.dataTransfer.setData('application/json', JSON.stringify({
                                              type: 'player',
                                              player: player
                                            }));
                                            e.dataTransfer.effectAllowed = 'copy';
                                            e.currentTarget.classList.add('dragging');
                                          };
                                          
                                          const handleDragEnd = (e) => {
                                            e.currentTarget.classList.remove('dragging');
                                          };

                                          return (
                                            <div
                                              key={playerId}
                                              className={`draggable-player flex items-center justify-between p-3 rounded-lg transition-all ${
                                                isPlaced
                                                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                                  : 'bg-neutral-700 hover:bg-neutral-600 cursor-grab'
                                              }`}
                                              draggable={!isPlaced}
                                              onDragStart={handleDragStart}
                                              onDragEnd={handleDragEnd}
                                            >
                                              <div className="flex items-center space-x-3">
                                                <Avatar name={playerName} size={40} className="border-2 border-sky-400" />
                                                <div>
                                                  <div className="flex items-center space-x-2">
                                                    <p className="text-sm font-medium">{playerName}</p>
                                                    {player.position && (
                                                      <span className="text-xs bg-sky-500/50 text-sky-300 px-2 py-0.5 rounded-full font-mono">
                                                        {player.position}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p className="text-xs text-neutral-400">{player.email || 'No email'}</p>
                                                </div>
                                              </div>
                                              {isPlaced && (
                                                <span className="text-xs font-bold text-green-400">PLACED</span>
                                              )}
                                            </div>
                                          );
                                        })}
                                    </div>
                                </div>

                                {/* Center Column: 3D Stadium */}
                                <div className="lg:col-span-1">
                                    <h4 className="text-sm font-medium text-neutral-300 mb-3">Team Formation</h4>
                                    <StadiumField
                                        selectedPlayers={selectedPlayers}
                                        playerPositions={playerPositions}
                                        onPlayerPositionChange={(playerId, position) => {
                                            // Handle clear operation
                                            if (position && position.clear) {
                                                setPlayerPositions(prev => {
                                                    const newPositions = { ...prev };
                                                    delete newPositions[playerId];
                                                    return newPositions;
                                                });
                                                return;
                                            }
                                            
                                            // Handle normal position update
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
                                        }}
                                        onClearPositions={() => {
                                            // Clear all player positions
                                            setPlayerPositions({});
                                        }}
                                        selectedPlayer={selectedPlayer3D}
                                        onPlayerSelect={setSelectedPlayer3D}
                                        onPlayerAdd={(player) => {
                                            // Add player to selected list when dropped on field
                                            const playerId = player._id || player.id;
                                            setSelectedPlayers(prev => {
                                                if (!prev.find(p => (p._id || p.id) === playerId)) {
                                                    return [...prev, player];
                                                }
                                                return prev;
                                            });
                                        }}
                                    />
                                </div>

                                {/* Right Column: Formation Suggestions */}
                                <div className="lg:col-span-1">
                                    <h4 className="text-sm font-medium text-neutral-300 mb-3">Formation Suggestions</h4>
                                    <div className="space-y-2">
                                        {getFormationSuggestions(selectedPlayers.length).map((formation, index) => (
                                            <div
                                                key={index}
                                                className={`formation-card p-3 rounded-lg border transition-all ${
                                                    selectedFormation === formation.name
                                                        ? 'border-sky-400 bg-sky-500/10'
                                                        : 'border-neutral-600 bg-neutral-700 hover:border-neutral-500'
                                                }`}
                                                onClick={() => handleFormationSelect(formation)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="text-white font-medium">{formation.name}</h5>
                                                    {selectedFormation === formation.name && (
                                                        <svg className="h-4 w-4 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <p className="text-neutral-400 text-xs mb-2">{formation.description}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {formation.positions.map((pos, idx) => (
                                                        <span key={idx} className="text-xs px-2 py-1 bg-neutral-600 rounded text-neutral-300">
                                                            {pos}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {getFormationSuggestions(selectedPlayers.length).length === 0 && (
                                            <div className="text-center py-4">
                                                <p className="text-neutral-500 text-sm">
                                                    {selectedPlayers.length < 5 
                                                        ? `Add ${5 - selectedPlayers.length} more players to see formations`
                                                        : selectedPlayers.length > 6
                                                        ? 'Too many players for predefined formations'
                                                        : 'No formations available'
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        
                                        {/* Clear positions button */}
                                        {Object.keys(playerPositions).length > 0 && (
                                            <button
                                                onClick={() => setPlayerPositions({})}
                                                className="w-full mt-3 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                                            >
                                                Clear All Positions
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>            {/* Footer with buttons */}
            <div className="p-4 bg-neutral-900 flex justify-between items-center flex-shrink-0 border-t border-neutral-700">
                <button 
                    onClick={handleBackStep} 
                    disabled={modalStep === 1} 
                    className="bg-transparent border border-neutral-600 hover:bg-neutral-700 text-neutral-300 hover:text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {modalStep === 1 ? 'Cancel' : 'Back'}
                </button>
                
                {modalStep < 3 ? (
                    <button 
                        onClick={handleNextStep} 
                        className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-sky-500/20"
                    >
                        <span>Next</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ) : (
                    <button 
                        onClick={handleCreateTeam} 
                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/20"
                    >
                        Create Team
                    </button>
                )}
            </div>
        </div>
      </AuthModal>
      </div>
    </React.Fragment>
  );
};
export default MyTeam;
