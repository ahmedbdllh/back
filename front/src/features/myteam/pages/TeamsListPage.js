import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Users, Star, Shield, PlusCircle } from 'lucide-react';
import { useToast, ToastContainer } from '../../../shared/ui/components/Toast';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
    100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .animate-pulse-border {
    animation: pulse 2s infinite;
  }
  
  @keyframes shimmer {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(100%);
    }
  }
  
  .shimmer-effect::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: shimmer 2s infinite;
    transform: translateX(-100%);
  }
`;

const TeamsListPage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my-teams'); // 'my-teams' or 'join-team'
  const [animateTeams, setAnimateTeams] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, team: null });
  const [leaveModal, setLeaveModal] = useState({ show: false, team: null });
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  
  // Toast hook
  const { toasts, success, error: showError, info, removeToast } = useToast();
  
  useEffect(() => {
    fetchCurrentUser();
    fetchUserTeams();
  }, []);
  
  // Trigger animation once data is loaded
  useEffect(() => {
    if (!loading && teams.length > 0) {
      setTimeout(() => setAnimateTeams(true), 100);
    }
  }, [loading, teams.length]);
  
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get('http://localhost:5003/api/auth/me', {
        headers: { 'x-auth-token': token }
      });
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };
  const fetchUserTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your teams');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('http://localhost:5004/api/teams/user/me', {
        headers: {
          'x-auth-token': token
        }
      });
      
      console.log('Teams data received:', response.data.teams);
      response.data.teams?.forEach((team, index) => {
        console.log(`Team ${index} logo:`, team.logo);
      });
      
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.response?.data?.error || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (player) => {
    return player.fullName || player.name || player.username || 
           (player.firstName && player.lastName ? `${player.firstName} ${player.lastName}` : '') ||
           player.email?.split('@')[0] || 'Unknown Player';
  };
  
  // Check if current user is captain of a team that might come from API
  const isTeamCaptain = (team) => {
    if (!currentUser || !currentUser._id || !team) return false;
    
    // Use backend's authoritative captain status if available
    if (team && team.hasOwnProperty('isCaptain')) {
      return team.isCaptain;
    }
    
    // Handle different captain data structures that might come from API
    const captainId = typeof team.captain === 'object' ? team.captain?._id : team.captain;
    const userId = currentUser._id;
    
    return captainId && userId && captainId === userId;
  };
  // Handle joining team with secret code
  // Team list without filtering
  const filteredTeams = teams;
  
  // Handle joining team with secret code
  const handleJoinTeam = async () => {
    if (!secretCode.trim()) {
      showError('Please enter a secret code');
      return;
    }
    
    setJoinLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5004/api/teams/join-by-code', {
        secretCode: secretCode.trim().toUpperCase()
      }, {
        headers: { 'x-auth-token': token }
      });
      
      success(`Successfully joined team "${response.data.team.name}"!`);
      setSecretCode('');
      setShowJoinModal(false);
      
      // Refresh teams list
      fetchUserTeams();
      
      // Navigate to the team page
      setTimeout(() => {
        navigate(`/team/${response.data.team._id}`);
      }, 1500);
    } catch (err) {
      console.error('Error joining team:', err);
      showError(err.response?.data?.error || 'Failed to join team. Please check the secret code.');
    } finally {
      setJoinLoading(false);
    }
  };
  
  // Handle team deletion
  const handleDeleteTeam = async () => {
    if (!deleteModal.team) return;
    
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`http://localhost:5004/api/teams/${deleteModal.team._id}`, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove the deleted team from the state
      setTeams(teams.filter(team => team._id !== deleteModal.team._id));
      success(`Successfully deleted team "${deleteModal.team.name}"`);
      setDeleteModal({ show: false, team: null });
    } catch (err) {
      console.error('Error deleting team:', err);
      showError(err.response?.data?.error || 'Failed to delete team. Please try again.');
    } finally {
      setDeleting(false);
    }
  };
  
  // Handle leaving a team (for non-captains)
  const handleLeaveTeam = async () => {
    if (!leaveModal.team) return;
    
    try {
      setLeaving(true);
      // First check auth token
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Authentication token missing. Please log in again.');
        return;
      }
      
      // Get userId with enhanced robust fallback logic
      let userId = currentUser?._id || currentUser?.id;
      
      // If userId is still missing, try to get it from localStorage or from the auth token
      if (!userId) {
        // Try localStorage
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          userId = storedUser._id || storedUser.id;
        } catch (e) {
          console.warn('Failed to parse user from localStorage for leave team:', e);
        }
        
        // If still no userId, try fetching from auth service
        if (!userId) {
          try {
            const response = await axios.get('http://localhost:5003/api/auth/me', {
              headers: { 'x-auth-token': token }
            });
            userId = response.data._id || response.data.id;
          } catch (e) {
            console.warn('Failed to fetch user from auth service:', e);
          }
        }
      }
      
      if (!userId) {
        console.error('Cannot leave team: userId not found after all attempts');
        showError('Unable to leave team. Please try logging in again.');
        setLeaving(false);
        setLeaveModal({ show: false, team: null });
        return;
      }
      
      console.log(`Attempting to leave team: ${leaveModal.team._id} for user: ${userId}`);
      
      const response = await axios.delete(`http://localhost:5004/api/teams/${leaveModal.team._id}/members/${userId}`, {
        headers: { 'x-auth-token': token }
      });
      
      console.log('Leave team response:', response.data);
      
      // Remove the team from the local state
      setTeams(teams.filter(t => t._id !== leaveModal.team._id));
      success(`Successfully left the team "${leaveModal.team.name}"`);
      setLeaveModal({ show: false, team: null });
    } catch (err) {
      console.error('Error leaving team:', err);
      
      // More detailed error information
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      
      let errorMessage = 'Failed to leave team. Please try again.';
      
      if (err.response?.status === 403) {
        errorMessage = err.response.data.error || 'You do not have permission to leave this team.';
      } else if (err.response?.status === 404) {
        errorMessage = err.response.data.error || 'Team or member not found.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      showError(errorMessage);
    } finally {
      setLeaving(false);
    }
  };
  
  // Handle successful team join
  const handleTeamJoined = () => {
    setShowJoinModal(false);
    fetchUserTeams(); // Refresh teams list
    success('Successfully joined the team!');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto py-20">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading your teams...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">My Teams</h3>
                <p className="text-gray-400">Teams you've created and joined</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Join Team</span>
                </button>
                
                <button
                  onClick={() => navigate('/create-team')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Team</span>
                </button>
              </div>
            </div>
            
            {/* Error handling */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            {/* Tab Navigation */}
            <div className="flex items-center mb-6 border-b border-white/10">
              <button
                className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                  activeTab === 'my-teams' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('my-teams')}
              >
                My Teams
                {activeTab === 'my-teams' && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
              
              <button
                className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                  activeTab === 'join-team' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('join-team')}
              >
                Join a Team
                {activeTab === 'join-team' && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            </div>
            
            {/* My Teams Content */}
            {activeTab === 'my-teams' && (
              <>
                {teams.length === 0 ? (
                  <div className="text-center py-20">
                    {/* Team Icon */}
                    <div className="flex justify-center mb-8">
                      <svg className="w-20 h-20 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    
                    {/* Main Heading */}
                    <h1 className="text-4xl font-bold text-white mb-6">
                      No Teams Yet, {currentUser?.fullName || currentUser?.name || currentUser?.email?.split('@')[0] || 'Player'}
                    </h1>
                    
                    {/* Subtitle */}
                    <p className="text-gray-400 text-lg mb-4 max-w-md mx-auto">
                      You're not currently part of any team. Ready to get in the game?
                    </p>
                    
                    {/* Instructions */}
                    <p className="text-blue-400 text-base mb-12 max-w-lg mx-auto">
                      Create your own team as captain or join an existing one with a team code
                    </p>
                    
                    {/* Action Cards */}
                    <div className="flex flex-col sm:flex-row gap-8 justify-center max-w-4xl mx-auto">
                      {/* Create Team Card */}
                      <div className="bg-gray-800/50 rounded-2xl p-8 flex-1 max-w-md border border-gray-700/50">
                        <div className="flex justify-center mb-6">
                          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-4">Create a Team</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                          Start your own team and invite others to join. Be the captain and lead your team to victory.
                        </p>
                        
                        <button
                          onClick={() => navigate('/create-team')}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create New Team
                        </button>
                      </div>
                      
                      {/* Join Team Card */}
                      <div className="bg-gray-800/50 rounded-2xl p-8 flex-1 max-w-md border border-gray-700/50">
                        <div className="flex justify-center mb-6">
                          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-4">Join a Team</h3>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                          Enter a team code to join an existing team. Connect with friends and play together.
                        </p>
                        
                        <div className="space-y-3">
                          <button
                            onClick={() => setActiveTab('join-team')}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                            </svg>
                            Join with Code
                          </button>
                          
                          <button
                            onClick={() => navigate('/browse-teams')}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Browse Public Teams
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team, index) => (
                      <motion.div
                        key={team._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                        onClick={() => navigate(`/team/${team._id}`)}
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={(() => {
                              const url = getImageUrl(team.logo, 'team');
                              console.log(`Team ${team.name} logo URL:`, url, 'Original logo:', team.logo);
                              return url;
                            })()}
                            alt={`${team.name} team`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              console.log('Team image failed to load:', team.logo, 'Generated URL:', e.target.src);
                              handleImageError(e, 'team', team.name);
                            }}
                          />
                          
                          {/* Status Badges */}
                          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                            {isTeamCaptain(team) && (
                              <div className="bg-yellow-600/80 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1.5 shadow-md">
                                <Star size={12} className="text-yellow-300" fill="currentColor" />
                                Captain
                              </div>
                            )}
                            
                            {team.isMatchReady && (
                              <div className="bg-green-600/80 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1.5 shadow-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse"></div>
                                Match Ready
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-xl font-semibold text-white mb-2">
                            {team.name}
                          </h3>
                          <p className="text-sm text-gray-400 mb-4">
                            {team.fieldType || 6}v{team.fieldType || 6} • {team.formation || 'No formation'}
                          </p>
                          
                          {/* Team Members Preview */}
                          <div className="flex -space-x-2 overflow-hidden mb-4">
                            {team.members.slice(0, 5).map((member, idx) => {
                              // Get member info from either direct member data or nested userInfo
                              const memberInfo = member.userInfo || member;
                              const memberName = memberInfo.fullName || memberInfo.name || memberInfo.email?.split('@')[0] || `Member ${idx + 1}`;
                              const profileImage = memberInfo.profileImage || member.profileImage;
                              
                              return (
                                <div
                                  key={idx}
                                  className="w-8 h-8 rounded-full border-2 border-gray-800 overflow-hidden relative group"
                                  title={memberName}
                                >
                                  {profileImage ? (
                                    <img 
                                      src={getImageUrl(profileImage, 'user')} 
                                      alt={memberName} 
                                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                                      onError={(e) => handleImageError(e, 'user', memberName)}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
                                      <span className="text-white text-xs font-medium">
                                        {memberName.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                                    {memberName}
                                  </div>
                                </div>
                              );
                            })}
                            
                            {team.members.length > 5 && (
                              <div 
                                className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-2 border-gray-800 relative group"
                                title={`+${team.members.length - 5} more members`}
                              >
                                <span className="text-white text-xs font-medium">+{team.members.length - 5}</span>
                                
                                {/* Tooltip for extra members */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                                  +{team.members.length - 5} more members
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Button */}
                          <div className="mt-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/team/${team._id}`);
                              }}
                              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Team Details
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Join Team Tab */}
            {activeTab === 'join-team' && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-md mx-auto"
                >
                  <div className="bg-white/5 border border-white/20 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
                    {/* Top header with icon */}
                    <div className="h-16 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoLTZ2LTZoNnYtNmg2djZoNnY2aC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
                      <div className="flex items-center gap-3 z-10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        
                        <h2 className="text-xl font-bold text-white">Join a Private Team</h2>
                      </div>
                    </div>
                    
                    {/* Content area */}
                    <div className="p-6">
                      <div className="text-center mb-4">
                        <p className="text-white/80">
                          Enter the secret code shared by your team captain to join their team instantly
                        </p>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                          <label className="block text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Team Secret Code
                          </label>
                          
                          <div className="relative">
                            <input
                              type="text"
                              value={secretCode}
                              onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                              placeholder="Enter code (e.g. ABC123)"
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-mono text-center tracking-wider"
                              maxLength={8}
                            />
                          </div>
                          
                          {/* Code visualization */}
                          <div className="flex justify-center mt-3 space-x-1.5">
                            {[0,1,2,3,4,5,6,7].map((i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0.5, y: 5 }}
                                animate={{                              
                                  opacity: i < secretCode.length ? 1 : 0.5,
                                  y: 0,
                                  transition: { delay: i * 0.05 }
                                }}
                                className={`w-6 h-7 rounded border flex items-center justify-center font-mono text-sm ${
                                  i < secretCode.length 
                                    ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-sm' 
                                    : 'border-white/10 bg-white/5 text-white/30'
                                }`}
                              >
                                {i < secretCode.length ? secretCode[i] : ''}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                        
                        <button
                          onClick={handleJoinTeam}
                          disabled={joinLoading || !secretCode.trim()}
                          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                            joinLoading || !secretCode.trim()
                              ? 'bg-white/10 text-white/40 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-blue-500/25 transform hover:scale-105'
                          }`}
                        >
                          {joinLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                              <span>Joining Team...</span>
                            </>
                          ) : (
                            <>
                              <Users size={18} className="mr-2" />
                              <span>Join Team</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="grid grid-cols-3 gap-4 text-sm text-center mb-6">
                          <div>
                            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-blue-400 text-xs font-bold">1</span>
                            </div>
                            <p className="text-white/70">Get code from captain</p>
                          </div>
                          
                          <div>
                            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-blue-400 text-xs font-bold">2</span>
                            </div>
                            <p className="text-white/70">Enter code above</p>
                          </div>
                          
                          <div>
                            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-blue-400 text-xs font-bold">3</span>
                            </div>
                            <p className="text-white/70">Join instantly</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-blue-300">
                            Need a code? Ask your team captain to share their team's secret code with you.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
            
            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white">Delete Team</h3>
                      <p className="text-sm text-gray-400">This action cannot be undone</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-6">
                    Are you sure you want to delete "<span className="font-semibold text-white">{deleteModal.team?.name}</span>"? 
                    This will permanently remove the team and all its data.
                  </p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setDeleteModal({ show: false, team: null })}
                      disabled={deleting}
                      className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleDeleteTeam}
                      disabled={deleting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {deleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <span>Delete Team</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Team Confirmation Modal */}
            {leaveModal.show && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white">Leave Team</h3>
                      <p className="text-sm text-gray-400">You can rejoin later if invited</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-6">
                    Are you sure you want to leave "<span className="font-semibold text-white">{leaveModal.team?.name}</span>"? 
                    You will no longer have access to team information.
                  </p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setLeaveModal({ show: false, team: null })}
                      disabled={leaving}
                      className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleLeaveTeam}
                      disabled={leaving}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {leaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Leaving...</span>
                        </>
                      ) : (
                        <span>Leave Team</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Toast Container */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
          </>
        )}
      </div>
    </div>
  );
};
export default TeamsListPage;
