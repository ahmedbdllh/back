import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MatchReadyStatus from '../components/MatchReadyStatus';
import AddPlayerModal from '../components/AddPlayerModal';
import PositionAssignment from '../components/PositionAssignment';
import { useFormations } from '../hooks/useFormations';
import { useToast, ToastContainer } from '../../../shared/ui/components/Toast';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

const TeamDetailsPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Toast hook
  const { toasts, success, error: showError, info, removeToast } = useToast();
  
  const {
    selectedFormation,
    playerPositions,
    getFormationSuggestions,
    handleFormationSelect,
    handlePlayerPositionChange,
    clearPositions,
    setSelectedFormation,
    setPlayerPositions,
    movePlayerToBench,
    movePlayerToField,
    benchPlayers
  } = useFormations();

  // Fetch team details
  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5004/api/teams/${teamId}`, {
        headers: { 'x-auth-token': token }
      });
      
      const teamData = response.data.team || response.data;
      setTeam(teamData);
      
      // Use membersInfo if available (enriched with user data), otherwise use members
      const members = teamData.membersInfo || teamData.members || [];
      
      // Remove duplicate members (captain might be listed twice)
      const uniqueMembers = members.filter((member, index, array) => 
        array.findIndex(m => m.userId === member.userId) === index
      );
      
      setTeamMembers(uniqueMembers);
      
      // Load saved formation and positions if any
      if (teamData.formation) {
        setSelectedFormation(teamData.formation);
      }
      
      // Set up positions from team member positions
      const savedPositions = {};
      uniqueMembers.forEach(member => {
        if (member.position && member.userId) {
          savedPositions[member.userId] = {
            position: member.position,
            x: member.x || 0,
            y: member.y || 0,
            isStarter: member.isStarter !== false // Preserve bench state from backend
          };
        }
      });
      
      if (Object.keys(savedPositions).length > 0) {
        setPlayerPositions(savedPositions);
      }
      
    } catch (err) {
      console.error('Error fetching team details:', err);
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchTeamDetails();
    }
  }, [teamId]);

  const handlePlayerAdded = () => {
    setShowAddPlayerModal(false);
    fetchTeamDetails(); // Refresh team data
  };

  // Manual save function for formation and positions
  const saveFormationAndPositions = async () => {
    if (!team || !selectedFormation || Object.keys(playerPositions).length === 0) {
      setSaveMessage('Please select a formation and assign player positions before saving.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      
      // Prepare the data to send
      const updateData = {
        formation: selectedFormation,
        memberPositions: Object.keys(playerPositions).map(playerId => ({
          userId: playerId,
          position: playerPositions[playerId].position,
          x: playerPositions[playerId].x,
          y: playerPositions[playerId].y,
          isStarter: playerPositions[playerId].isStarter !== false
        }))
      };

      console.log('Saving formation and positions:', updateData);

      const response = await axios.put(`http://localhost:5004/api/teams/${teamId}/formation`, updateData, {
        headers: { 'x-auth-token': token }
      });
      
      // Refresh team data to see the saved changes
      await fetchTeamDetails();
      setSaveMessage('Team formation saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (err) {
      console.error('Error saving formation:', err);
      setSaveMessage('Failed to save team formation. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle formation selection
  const handleFormationSelectWithoutSave = (formation) => {
    const transformedPlayers = activeMembers.map(member => ({
      ...member, // Spread first
      _id: member.userId, // Then override with correct IDs
      id: member.userId,
      fullName: member.userInfo?.fullName || member.fullName,
      name: member.userInfo?.name || member.name,
      username: member.userInfo?.username || member.username,
      email: member.userInfo?.email || member.email,
      position: member.position
    }));
    
    handleFormationSelect(formation, transformedPlayers);
  };

  // Handle player position change
  const handlePlayerPositionChangeWithoutSave = (playerId, position) => {
    handlePlayerPositionChange(playerId, position);
  };

  const activeMembers = teamMembers.filter(member => member.status === 'active');
  const fieldType = team?.fieldType || 6;

  // Check if current user is the team captain
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      return parsedUser;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const isTeamCaptain = () => {
    // Use backend's authoritative captain status if available
    if (team && team.hasOwnProperty('isCaptain')) {
      return team.isCaptain;
    }
    
    // If backend didn't provide captain status, fall back to local check
    const currentUser = getCurrentUser();
    if (!currentUser || !team) {
      return false;
    }
    
    const captainId = typeof team.captain === 'object' ? team.captain._id : team.captain;
    let userId = currentUser.id || currentUser._id;
    
    // If userId is still undefined, try to get it from the team members list
    // by matching the current user's email with team members
    if (!userId && currentUser.email) {
      const matchingMember = teamMembers.find(member => 
        member.userInfo?.email === currentUser.email ||
        member.email === currentUser.email
      );
      if (matchingMember) {
        userId = matchingMember.userId;
      }
    }
    
    // Ensure both are strings for comparison
    const normalizedCaptainId = captainId ? captainId.toString() : '';
    const normalizedUserId = userId ? userId.toString() : '';
    const isCaptain = normalizedCaptainId === normalizedUserId && normalizedCaptainId !== '';
    
    return isCaptain;
  };

  // Temporary fix for corrupted user data - can be removed later
  const fixUserDataIfNeeded = () => {
    const currentUser = getCurrentUser();

    if (currentUser && !currentUser.id && !currentUser._id && currentUser.email) {
      // Try to find the user ID from team members
      const matchingMember = teamMembers.find(member => {
        const memberEmail = member.userInfo?.email || member.email;
        return memberEmail === currentUser.email;
      });
      
      if (matchingMember) {
        const fixedUserData = {
          ...currentUser,
          id: matchingMember.userId,
          _id: matchingMember.userId
        };
        
        localStorage.setItem('user', JSON.stringify(fixedUserData));
        
        // Force a re-render by updating state
        setTeam(prevTeam => ({ ...prevTeam }));
        
        // Also trigger a page refresh to ensure all components get updated
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  };

  // Call the fix when team members are loaded
  useEffect(() => {
    if (teamMembers.length > 0) {
      fixUserDataIfNeeded();
    }
  }, [teamMembers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
          <p className="text-white">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Team</h2>
          <p className="text-neutral-400 mb-4">{error || 'Team not found'}</p>
          <button 
            onClick={() => navigate('/my-team')}
            className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to My Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-blue-900">
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
                {team.logo && (
                  <img 
                    src={getImageUrl(team.logo, 'team')} 
                    alt={team.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-sky-400"
                    onError={(e) => handleImageError(e, 'team', team.name)}
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">{team.name}</h1>
                  <p className="text-neutral-200">{team.sport} • {fieldType} vs {fieldType}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Add Players Button - Only for Captains */}
              {isTeamCaptain() && (
                <button
                  onClick={() => setShowAddPlayerModal(true)}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Players</span>
                </button>
              )}
              
              {/* Role Indicator for Non-Captains */}
              {!isTeamCaptain() && (
                <div className="text-sm text-gray-400 bg-blue-500/20 px-3 py-1 rounded-full flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Team Member</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Secret Code Display for Private Teams */}
        {team.settings && !team.settings.isPublic && team.settings.secretCode && isTeamCaptain() && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-amber-400 font-semibold text-lg mb-2 flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Private Team Secret Code</span>
                  </h3>
                  <div className="bg-neutral-900/50 rounded-lg p-3 inline-block">
                    <code className="text-amber-300 text-xl font-mono tracking-wider">
                      {team.settings.secretCode}
                    </code>
                  </div>
                  <p className="text-amber-200 text-sm mt-2">
                    Share this code with players to let them join your private team
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(team.settings.secretCode);
                    success('Secret code copied to clipboard!');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Code</span>
                </button>
              </div>
              
              {/* Share Buttons */}
              <div className="border-t border-amber-500/20 pt-4">
                <p className="text-amber-200 text-sm mb-3">Share directly with players:</p>
                <div className="flex flex-wrap gap-3">
                  {/* WhatsApp Share */}
                  <button
                    onClick={() => {
                      const message = encodeURIComponent(`Join my ${team.sport} team "${team.name}"!\n\nUse this secret code: ${team.settings.secretCode}\n\nLet's play together!`);
                      window.open(`https://wa.me/?text=${message}`, '_blank');
                      success('WhatsApp share opened!');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                    </svg>
                    <span>WhatsApp</span>
                  </button>

                  {/* Facebook Messenger Share */}
                  <button
                    onClick={() => {
                      const message = `Join my ${team.sport} team "${team.name}"! Use this secret code: ${team.settings.secretCode}. Let's play together!`;
                      // Copy message to clipboard and notify user
                      navigator.clipboard.writeText(message).then(() => {
                        info('Message copied to clipboard! Open Messenger and paste it to share.');
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.498 1.744 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.626 0 12-4.974 12-11.111C24 4.975 18.626 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.1l3.131 3.26L19.752 8.1l-6.561 6.863z"/>
                    </svg>
                    <span>Messenger</span>
                  </button>

                  {/* SMS Share */}
                  <button
                    onClick={() => {
                      const message = encodeURIComponent(`Join my ${team.sport} team "${team.name}"! Use this secret code: ${team.settings.secretCode}. Let's play together!`);
                      window.open(`sms:?body=${message}`, '_blank');
                      success('SMS share opened!');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>SMS</span>
                  </button>

                  {/* Email Share */}
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent(`Join my ${team.sport} team "${team.name}"`);
                      const body = encodeURIComponent(`Hi!\n\nI'd like to invite you to join my ${team.sport} team "${team.name}".\n\nTo join the team, use this secret code: ${team.settings.secretCode}\n\nLet's play together!\n\nBest regards`);
                      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                      success('Email share opened!');
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Ready Status */}
        <MatchReadyStatus 
          team={team}
          activeMembers={activeMembers.length}
          requiredPlayers={fieldType}
        />

        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeMembers.length}</p>
                <p className="text-sm text-neutral-400">Active Players</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{team.statistics?.wins || 0}</p>
                <p className="text-sm text-neutral-400">Wins</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{team.statistics?.matchesPlayed || 0}</p>
                <p className="text-sm text-neutral-400">Matches Played</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formation and Players - Only for Captains */}
        {activeMembers.length > 0 && isTeamCaptain() && (
          <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Team Formation</span>
              </h2>
              
              {/* Save Button */}
              <button
                onClick={saveFormationAndPositions}
                disabled={isSaving || !selectedFormation || Object.keys(playerPositions).length === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isSaving || !selectedFormation || Object.keys(playerPositions).length === 0
                    ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25'
                }`}
                title={`Formation: ${selectedFormation || 'None'}, Positions: ${Object.keys(playerPositions).length}`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Save Team</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Save Message */}
            {saveMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                saveMessage.includes('success') ? 'bg-green-900/50 text-green-300 border border-green-700' 
                : 'bg-red-900/50 text-red-300 border border-red-700'
              }`}>
                {saveMessage}
              </div>
            )}
            
            <PositionAssignment
              selectedPlayers={activeMembers.map(member => {
                const transformedPlayer = {
                  ...member, // Spread first
                  _id: member.userId, // Then override with correct IDs
                  id: member.userId,  // Use userId for both _id and id
                  fullName: member.userInfo?.fullName || member.fullName,
                  name: member.userInfo?.name || member.name,
                  username: member.userInfo?.username || member.username,
                  email: member.userInfo?.email || member.email,
                  position: member.position
                };
                return transformedPlayer;
              })}
              teamSport={team.sport}
              playerPositions={playerPositions}
              onPlayerPositionChange={handlePlayerPositionChangeWithoutSave}
              onClearPositions={clearPositions}
              formations={(() => {
                const formations = getFormationSuggestions(activeMembers.length, team.sport);
                return formations;
              })()}
              selectedFormation={selectedFormation}
              onFormationSelect={handleFormationSelectWithoutSave}
              benchPlayers={benchPlayers.map(playerId => {
                const member = activeMembers.find(m => (m.userId || m._id) === playerId);
                if (member) {
                  return {
                    ...member,
                    _id: member.userId,
                    id: member.userId,
                    fullName: member.userInfo?.fullName || member.fullName,
                    name: member.userInfo?.name || member.name,
                    username: member.userInfo?.username || member.username,
                    email: member.userInfo?.email || member.email,
                    position: member.position
                  };
                }
                return null;
              }).filter(Boolean)}
              onMovePlayerToBench={movePlayerToBench}
              onMovePlayerToField={movePlayerToField}
              showBench={true}
            />
          </div>
        )}

        {/* Read-Only Formation View for Non-Captains */}
        {activeMembers.length > 0 && !isTeamCaptain() && (
          <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Team Formation</span>
              </h2>
              <div className="text-sm text-gray-400 bg-blue-500/20 px-3 py-1 rounded-full">
                View Only
              </div>
            </div>
            
            <PositionAssignment
              selectedPlayers={activeMembers.map(member => {
                const transformedPlayer = {
                  ...member, // Spread first
                  _id: member.userId, // Then override with correct IDs
                  id: member.userId,  // Use userId for both _id and id
                  fullName: member.userInfo?.fullName || member.fullName,
                  name: member.userInfo?.name || member.name,
                  username: member.userInfo?.username || member.username,
                  email: member.userInfo?.email || member.email,
                  position: member.position
                };
                return transformedPlayer;
              })}
              sport={team.sport}
              fieldType={team.fieldType}
              selectedFormation={selectedFormation}
              playerPositions={playerPositions}
              onFormationSelect={() => {}} // Disabled for non-captains
              onPlayerPositionChange={() => {}} // Disabled for non-captains
              benchPlayers={benchPlayers}
              onMovePlayerToBench={() => {}} // Disabled for non-captains
              onMovePlayerToField={() => {}} // Disabled for non-captains
              showBench={true}
              readOnly={true} // Pass read-only prop
            />
          </div>
        )}

        {/* Team Members List */}
        <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Team Members ({activeMembers.length})</span>
          </h2>
          
          <div className="grid gap-4">
            {teamMembers.map((member, index) => (
              <div key={`member-${member.userId || member._id || index}`} className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {/* Profile Image */}
                  {(member.userInfo?.profileImage || member.profileImage) ? (
                    <img
                      src={getImageUrl(member.userInfo?.profileImage || member.profileImage, 'user')}
                      alt={member.userInfo?.name || member.name || 'Player'}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-600"
                      onError={(e) => handleImageError(e, 'user', member.userInfo?.name || member.name)}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {member.userInfo?.fullName || member.userInfo?.name || member.userInfo?.username || 
                       member.fullName || member.name || member.username ||
                       (member.userInfo?.firstName && member.userInfo?.lastName ? `${member.userInfo.firstName} ${member.userInfo.lastName}` : '') ||
                       member.userInfo?.email?.split('@')[0] || 'Unknown Player'}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {member.userId === team.captain ? 'Captain' : (member.position || 'No position')} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === 'active' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {member.status}
                  </span>
                  {member.jerseyNumber && (
                    <span className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded text-xs font-medium">
                      #{member.jerseyNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {activeMembers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-neutral-400">No active team members yet.</p>
                {isTeamCaptain() && (
                  <button
                    onClick={() => setShowAddPlayerModal(true)}
                    className="mt-2 text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Add your first player
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Player Modal - Only for Captains */}
      {isTeamCaptain() && (
        <AddPlayerModal
          isOpen={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          teamId={teamId}
          teamSport={team?.sport}
          currentMembers={teamMembers}
          maxMembers={8}
          onPlayerAdded={handlePlayerAdded}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TeamDetailsPage;
