import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeamForm from '../components/TeamForm';
import AvailablePlayers from '../components/AvailablePlayers';
import SelectedPlayersList from '../components/SelectedPlayersList';
import PositionAssignment from '../components/PositionAssignment';
import { usePlayerSearch } from '../hooks/usePlayerSearch';
import { usePlayerSelection } from '../hooks/usePlayerSelection';
import { useFormations } from '../hooks/useFormations';
import { useTeamModal } from '../hooks/useTeamModal';

const CreateTeamPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingTeams, setExistingTeams] = useState([]);
  const [checkingTeams, setCheckingTeams] = useState(true);

    // Reset success state on unmount
  // Team creation state
  const {
    teamName,
    setTeamName,
    teamSport,
    setTeamSport,
    teamLogo,
    setTeamLogo,
    error: teamError,
    setError: setTeamError
  } = useTeamModal();

  // Field type selection (6 or 7 players on field, max 8 total including substitutes)
  const [fieldType, setFieldType] = useState(6); // Default to 6 players

  // Team privacy settings
  const [isPublic, setIsPublic] = useState(true); // Default to public team
  const [secretCode, setSecretCode] = useState(''); // Will be generated for private teams

  // Player search and selection
  const {
    searchQuery,
    selectedSport,
    selectedPosition,
    availablePlayers: searchResults,
    handleSearchChange,
    handleSportFilter,
    handlePositionFilter,
    loadInitialPlayers,
    isSearching
  } = usePlayerSearch();

  const {
    selectedPlayers,
    addPlayer,
    removePlayer
  } = usePlayerSelection();

  // Formation management
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

  // Check for existing teams when component loads
  useEffect(() => {
    const checkExistingTeams = async () => {
      try {
        setCheckingTeams(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5004/api/teams/user/me', {
          headers: { 'x-auth-token': token }
        });
        setExistingTeams(response.data.teams || []);
      } catch (err) {
        console.error('Error checking existing teams:', err);
      } finally {
        setCheckingTeams(false);
      }
    };

    checkExistingTeams();
  }, []);

  // Load initial players when entering step 2
  useEffect(() => {
    if (currentStep === 2) {
      loadInitialPlayers(teamSport);
    }
  }, [currentStep, loadInitialPlayers, teamSport]);

  // Check if captain already has a team for the selected sport
  const hasTeamForSport = (sport) => {
    return existingTeams.some(team => team.sport === sport);
  };

  // Get existing team for a sport
  const getExistingTeamForSport = (sport) => {
    return existingTeams.find(team => team.sport === sport);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!teamName.trim()) {
        setTeamError('Please enter a team name');
        return;
      }
      if (teamName.trim().length < 2) {
        setTeamError('Team name must be at least 2 characters long');
        return;
      }
      if (teamName.trim().length > 50) {
        setTeamError('Team name must be less than 50 characters');
        return;
      }
      if (!teamSport) {
        setTeamError('Please select a sport');
        return;
      }
      // Check if captain already has a team for this sport
      if (hasTeamForSport(teamSport)) {
        const existingTeam = getExistingTeamForSport(teamSport);
        setTeamError(`You already have a ${teamSport} team named "${existingTeam.name}". You can only create one team per sport type.`);
        return;
      }
      if ((teamSport === 'Football' || teamSport === 'Paddle') && !fieldType) {
        setTeamError('Please select a field type');
        return;
      }
      setTeamError('');
    }
    
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Maximum team size is always 8 total players
    const maxMembers = 8;
    
    // Validation for maximum 8 total players including captain
    const totalMembers = 1 + selectedPlayers.length; // Captain + selected players
    if (totalMembers > maxMembers) {
      setError(`Maximum team size is 8 players total. You have selected ${selectedPlayers.length} players plus yourself as captain.`);
      setLoading(false);
      return;
    }
    
    // Teams can be created with just the captain - they can invite players later using the secret code
    // No minimum player requirement - captain can create team alone and invite friends
    
    // Validation for football teams - positions are required only if players are selected
    if (teamSport === 'Football' && selectedPlayers.length > 0) {
      const positionedPlayers = Object.keys(playerPositions).length;
      if (positionedPlayers === 0) {
        setError('Please assign positions to your players or select a formation.');
        setLoading(false);
        return;
      }
      if (positionedPlayers < selectedPlayers.length) {
        setError(`Please assign positions to all ${selectedPlayers.length} selected players.`);
        setLoading(false);
        return;
      }
    }
    
    try {
      const formData = new FormData();
      formData.append('name', teamName);
      formData.append('sport', teamSport);
      formData.append('maxMembers', '8'); // Always 8 total players
      formData.append('fieldType', fieldType.toString()); // 6 or 7 players on field
      formData.append('isPublic', isPublic.toString()); // Privacy setting
      
      if (teamLogo && teamLogo.file) {
        formData.append('logo', teamLogo.file);
      }
      
      // Add selected players with their positions
      if (selectedPlayers.length > 0) {
        const playersWithPositions = selectedPlayers.map(player => {
          const playerId = player._id || player.id;
          const playerPosition = playerPositions[playerId];
          
          return {
            ...player,
            // Include full position data including coordinates and starter status
            position: playerPosition?.position || null,
            x: playerPosition?.x || null,
            y: playerPosition?.y || null,
            isStarter: playerPosition?.isStarter !== false // Default to true if not explicitly false
          };
        });
        formData.append('selectedPlayers', JSON.stringify(playersWithPositions));
      }
      
      // Include formation if selected
      if (selectedFormation) {
        formData.append('formation', selectedFormation);
      }
      
      // Use the service-team API endpoint (running on port 5004)
      const res = await axios.post('http://localhost:5004/api/teams', formData, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        },
      });
      
      if (res.data) {
        setSuccess(true);
        setError('');
        
        const createdTeam = res.data.team;
        
        // Store secret code if team is private
        if (!isPublic && createdTeam.settings?.secretCode) {
          setSecretCode(createdTeam.settings.secretCode);
        }
        
        // Show success message and redirect to My Teams page
        setTimeout(() => {
          // Navigate to My Team page where the user can see their created team
          navigate('/my-team');
        }, 4000); // Extended timeout for private teams to show secret code
        
        console.log(`Team created successfully with ${selectedPlayers.length} additional players!`);
      }
    } catch (err) {
      console.error('Error creating team:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(err.response?.data?.error || err.response?.data?.msg || 'Failed to create team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TeamForm
            teamName={teamName}
            setTeamName={setTeamName}
            teamSport={teamSport}
            setTeamSport={setTeamSport}
            teamLogo={teamLogo}
            setTeamLogo={setTeamLogo}
            fieldType={fieldType}
            setFieldType={setFieldType}
            error={teamError}
            existingTeams={existingTeams}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
          />
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <AvailablePlayers
              players={searchResults || []}
              selectedPlayers={selectedPlayers}
              onAddPlayer={addPlayer}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSportFilter={handleSportFilter}
              onPositionFilter={handlePositionFilter}
              selectedSport={selectedSport}
              selectedPosition={selectedPosition}
              isSearching={isSearching}
            />
            <div className="mt-6">
              <SelectedPlayersList
                selectedPlayers={selectedPlayers || []}
                onRemovePlayer={removePlayer}
              />
            </div>
          </div>
        );
      
      case 3:
        console.log('Step 3 - Position Assignment props:', {
          selectedPlayers: selectedPlayers,
          selectedPlayersLength: selectedPlayers.length,
          teamSport: teamSport,
          formations: getFormationSuggestions(selectedPlayers.length),
          formationsLength: getFormationSuggestions(selectedPlayers.length).length
        });
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
              if (!selectedPlayers.find(p => (p._id || p.id) === playerId)) {
                addPlayer(player);
              }
            }}
            formations={getFormationSuggestions(selectedPlayers.length)}
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

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Team Information';
      case 2: return 'Select Players';
      case 3: return 'Formation & Strategy';
      default: return '';
    }
  };

  const progressPercentage = (currentStep / 3) * 100;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-800 rounded-2xl p-8 text-center border border-neutral-700 shadow-2xl">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Team Created Successfully!</h2>
            <p className="text-neutral-400 mb-4">Your team "{teamName}" has been created!</p>
            
            {/* Show secret code for private teams */}
            {!isPublic && secretCode && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-amber-400 font-semibold mb-2">🔒 Private Team Secret Code</h3>
                <div className="bg-neutral-900 rounded-lg p-3 mb-2">
                  <code className="text-amber-300 text-xl font-mono tracking-wider">{secretCode}</code>
                </div>
                <p className="text-amber-200 text-xs">
                  Share this code with players to let them join your private team
                </p>
              </div>
            )}
            
            <button
              onClick={() => navigate('/my-team')}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Go to My Teams
            </button>
          </div>
          <div className="animate-pulse">
            <div className="w-full bg-neutral-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-blue-900">
      {checkingTeams ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
            <p className="text-white">Checking your existing teams...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-800 via-neutral-700 to-sky-600 border-b border-neutral-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/my-team')} 
                className="text-neutral-300 hover:text-white transition-colors p-2 hover:bg-neutral-700 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2">
                  <svg className="h-8 w-8 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M19 3v4M17 5h4M14 11l-1.5-1.5L11 11l-1.5 1.5L11 14l1.5-1.5L14 14l1.5 1.5L17 14l-1.5-1.5L17 11l-1.5-1.5-1.5 1.5z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Create Your Team</h1>
                  <p className="text-neutral-200">Build your championship squad</p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-200">
                Step {currentStep} of 3 - {getStepTitle()}
              </p>
              <p className="text-sm font-medium text-sky-300">{Math.round(progressPercentage)}% Complete</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="w-full bg-neutral-600 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-sky-500 to-blue-500 h-2 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
            </div>
            
            {/* Step indicators */}
            <div className="flex justify-between mt-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center space-y-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                    step <= currentStep 
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
                      : 'bg-neutral-600 text-neutral-400'
                  }`}>
                    {step < currentStep ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  <span className={`text-xs transition-colors duration-300 ${
                    step <= currentStep ? 'text-sky-300' : 'text-neutral-500'
                  }`}>
                    {step === 1 ? 'Info' : step === 2 ? 'Players' : 'Formation'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm animate-fadeIn">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className={`bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700 ${
          currentStep === 1 ? 'p-8 max-w-lg mx-auto' : 'p-8 min-h-[600px]'
        }`}>
          {getStepContent()}
        </div>

        {/* Navigation Footer */}
        <div className="mt-8 flex justify-between items-center">
          <button 
            onClick={handleBackStep} 
            disabled={currentStep === 1} 
            className="bg-transparent border border-neutral-600 hover:bg-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {currentStep > 1 && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
            <span>{currentStep === 1 ? 'Cancel' : 'Back'}</span>
          </button>
          
          {currentStep < 3 ? (
            <button 
              onClick={handleNextStep} 
              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-sky-500/30 transform hover:scale-105"
            >
              <span>Next Step</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={handleCreateTeam} 
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-neutral-600 disabled:to-neutral-600 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/30 transform hover:scale-105 disabled:transform-none disabled:shadow-none flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Team...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Team</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default CreateTeamPage;
