import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TeamHeader,
  PlayerSearch,
  PlayerList,
  SelectedPlayersList,
  TeamForm,
  PositionAssignment,
  MyTeamModal,
  useTeam,
  usePlayerSearch,
  usePlayerSelection,
  useFormations,
  useTeamModal
} from './';

const MyTeam = () => {
  // Custom styles
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
      background-color: #1a5a1e;
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

  // Team management state
  const { hasTeam, team, fetchTeam, setTeam, setHasTeam } = useTeam();
  const [showJoinTeamInput, setShowJoinTeamInput] = useState(false);
  const [joinTeamCode, setJoinTeamCode] = useState('');

  // Modal state
  const {
    showCreateTeamModal,
    setShowCreateTeamModal,
    modalStep,
    teamName,
    setTeamName,
    teamSport,
    setTeamSport,
    teamLogo,
    setTeamLogo,
    error,
    setError,
    resetModal,
    handleNextStep,
    handleBackStep
  } = useTeamModal();

  // Player search state
  const {
    searchQuery,
    availablePlayers,
    isSearching,
    handleSearchChange,
    loadInitialPlayers
  } = usePlayerSearch();

  // Player selection state
  const {
    selectedPlayers,
    addPlayer,
    removePlayer,
    setSelectedPlayers
  } = usePlayerSelection();

  // Formation state
  const {
    selectedFormation,
    playerPositions,
    benchPlayers,
    getFormationSuggestions,
    handleFormationSelect,
    handlePlayerPositionChange,
    clearPositions,
    movePlayerToBench,
    movePlayerToField
  } = useFormations();

  const [selectedPlayer3D, setSelectedPlayer3D] = useState(null);

  // Load initial players when modal opens on step 2
  useEffect(() => {
    if (showCreateTeamModal && modalStep === 2) {
      loadInitialPlayers();
    }
  }, [showCreateTeamModal, modalStep, loadInitialPlayers]);

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
      const formData = new FormData();
      formData.append('name', teamName);
      formData.append('sport', teamSport);
      
      if (teamLogo) {
        formData.append('logo', teamLogo);
      }
      
      // For the auth service (simple team creation)
      const res = await axios.post('http://localhost:5000/api/teams/create', formData, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        },
      });
      
      if (res.data) {
        setTeam(res.data);
        setHasTeam(true);
        resetModal();
        
        if (selectedPlayers.length > 0) {
          console.log('Team created! Invitations should be sent to:', selectedPlayers);
        }
      }
    } catch (err) {
      console.error('Error creating team:', err);
      setError(err.response?.data?.error || err.response?.data?.msg || 'Failed to create team. Please try again.');
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://localhost:5004/api/teams/join', 
        { joinCode: joinTeamCode },
        { headers: { 'x-auth-token': token } }
      );
      setTeam(res.data.team);
      setHasTeam(true);
      setShowJoinTeamInput(false);
      setJoinTeamCode('');
    } catch (err) {
      console.error('Error joining team:', err);
    }
  };

  const renderModalContent = () => {
    switch (modalStep) {
      case 1:
        return (
          <TeamForm
            teamName={teamName}
            setTeamName={setTeamName}
            teamSport={teamSport}
            setTeamSport={setTeamSport}
            teamLogo={teamLogo}
            setTeamLogo={setTeamLogo}
            error={error}
          />
        );
      
      case 2:
        return (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <div className="mx-auto bg-sky-500/20 rounded-full h-12 w-12 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m13.4-2.382a4 4 0 11-5.292 0M15 12a4 4 0 110-5.292" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Select Players</h3>
              <p className="text-neutral-400 text-sm">Choose players to invite to your team</p>
            </div>

            <div className="space-y-4">
              <PlayerSearch
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                isSearching={isSearching}
              />

              <div className="h-80 bg-neutral-800 rounded-lg overflow-hidden">
                {isSearching && (
                  <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400 mx-auto mb-2"></div>
                      <p className="text-neutral-400 text-sm">Searching players...</p>
                    </div>
                  </div>
                )}
                
                <div className="h-full p-4 flex flex-col">
                  <PlayerList
                    players={availablePlayers}
                    selectedPlayers={selectedPlayers}
                    onAddPlayer={addPlayer}
                    onRemovePlayer={removePlayer}
                    isSearching={isSearching}
                    searchQuery={searchQuery}
                  />
                </div>
              </div>
              
              <SelectedPlayersList
                selectedPlayers={selectedPlayers}
                onRemovePlayer={removePlayer}
              />
            </div>
          </div>
        );
      
      case 3:
        return (
          <PositionAssignment
            selectedPlayers={selectedPlayers}
            teamSport={teamSport}
            playerPositions={playerPositions}
            onPlayerPositionChange={handlePlayerPositionChange}
            onClearPositions={clearPositions}
            selectedPlayer3D={selectedPlayer3D}
            onPlayerSelect={setSelectedPlayer3D}
            onPlayerAdd={(player) => {
              const playerId = player._id || player.id;
              setSelectedPlayers(prev => {
                if (!prev.find(p => (p._id || p.id) === playerId)) {
                  return [...prev, player];
                }
                return prev;
              });
            }}
            formations={getFormationSuggestions(selectedPlayers.length, teamSport)}
            selectedFormation={selectedFormation}
            onFormationSelect={(formation) => handleFormationSelect(formation, selectedPlayers)}
            benchPlayers={benchPlayers}
            onMovePlayerToBench={movePlayerToBench}
            onMovePlayerToField={movePlayerToField}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      <style>{customStyles}</style>
      <div className="bg-neutral-900 min-h-screen text-white p-8">
        <div className="container mx-auto">
          <TeamHeader hasTeam={hasTeam} teamName={team?.name} />

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
                    <img 
                      src={member.profileImage ? `http://localhost:5000${member.profileImage}` : 'https://i.pravatar.cc/150?u=a042581f4e29026704d'} 
                      alt={member.fullName} 
                      className="w-24 h-24 rounded-full mb-4 border-2 border-sky-400" 
                    />
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
        </div>

        <MyTeamModal
          isOpen={showCreateTeamModal}
          onClose={resetModal}
          modalStep={modalStep}
          onNextStep={handleNextStep}
          onBackStep={handleBackStep}
          onCreateTeam={handleCreateTeam}
        >
          {renderModalContent()}
        </MyTeamModal>
      </div>
    </React.Fragment>
  );
};

export default MyTeam;
