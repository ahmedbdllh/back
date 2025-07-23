import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast, ToastContainer } from '../../../shared/ui/components/Toast';
import JoinTeamByCode from '../../myteam/components/JoinTeamByCode';
import EmptyTeamState from '../../myteam/components/EmptyTeamState';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

const MyTeamsTab = ({ user }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, team: null });
  const [leaveModal, setLeaveModal] = useState({ show: false, team: null });
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { toasts, removeToast, success, error: showError } = useToast();

  // Fetch user's teams
  const fetchUserTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5004/api/teams/user/me', {
        headers: { 'x-auth-token': token }
      });
      
      const teamsData = response.data.teams || [];
      console.log('MyTeamsTab: Received teams data:', teamsData);
      if (teamsData.length > 0) {
        console.log('MyTeamsTab: First team structure:', teamsData[0]);
        console.log('MyTeamsTab: First team members:', teamsData[0].members);
        if (teamsData[0].members && teamsData[0].members.length > 0) {
          console.log('MyTeamsTab: First member structure:', teamsData[0].members[0]);
        }
      }
      setTeams(teamsData);
      setError('');
    } catch (err) {
      console.error('Error fetching user teams:', err);
      setError('Failed to load teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserTeams();
      
      // Check URL for join parameter to automatically open join modal
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('join') === 'true') {
        setShowJoinModal(true);
        // Remove the parameter from URL to avoid reopening on refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [user]);

  // Check if user is captain of a team with robust fallback logic
  const isTeamCaptain = (team) => {
    // Use backend's authoritative captain status if available (same as TeamDetailsPage)
    if (team && team.hasOwnProperty('isCaptain')) {
      return team.isCaptain;
    }
    
    // If backend didn't provide captain status, fall back to local check
    const captainId = typeof team.captain === 'object' ? team.captain._id : team.captain;
    
    // Try multiple ways to get the current user's ID
    let userId = user._id || user.id;
    
    // If userId is still undefined, try to get it from localStorage
    if (!userId) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        userId = storedUser._id || storedUser.id;
      } catch (e) {
        console.warn('Failed to parse user from localStorage:', e);
      }
    }
    
    // If still no userId, try to find it by matching email in team members
    if (!userId && user.email && team.members) {
      const matchingMember = team.members.find(member => {
        const memberEmail = typeof member === 'object' ? member.email : null;
        return memberEmail === user.email;
      });
      if (matchingMember) {
        userId = typeof matchingMember === 'object' ? matchingMember._id : matchingMember;
      }
    }
    
    // Additional fallback: try to match by email with captain directly
    if (!userId && user.email && typeof team.captain === 'object' && team.captain.email) {
      if (team.captain.email === user.email) {
        userId = team.captain._id;
      }
    }
    
    const isCaptain = captainId === userId;
    
    return isCaptain;
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
      setDeleteModal({ show: false, team: null });
    } catch (err) {
      console.error('Error deleting team:', err);
      setError('Failed to delete team. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // This function has been replaced by direct calls to setLeaveModal

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
        let userId = user?._id || user?.id;
        
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

  // Debug functions have been removed

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400">Loading your teams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">My Teams</h3>
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
            onClick={() => window.location.href = '/create-team'}
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
        <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Empty State or Teams Grid */}
      {teams.length === 0 ? (
        <EmptyTeamState 
          user={user}
          onCreateClick={() => window.location.href = '/create-team'}
          onJoinClick={() => setShowJoinModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
          <div
            key={team._id}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {/* Team Image Banner */}
            <div className="relative h-40 w-full overflow-hidden">
              <img 
                src={getImageUrl(team.logo, 'team')}
                alt={team.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => handleImageError(e, 'team', team.name)}
              />
              
              {/* Sport Type Badge */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                {team.sport || "Football"}
              </div>
              
              {/* Captain Badge (if applicable) */}
              {isTeamCaptain(team) && (
                <div className="absolute top-3 right-3 bg-yellow-600/80 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1.5 shadow-md">
                  <svg className="w-3 h-3 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Captain
                </div>
              )}
            </div>
            
            {/* Team Header */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-xl font-semibold text-white">{team.name}</h4>
                  <p className="text-sm text-gray-400">{team.fieldType || 6}v{team.fieldType || 6} • {team.formation || 'No formation'}</p>
                </div>
                
                {/* Actions Dropdown */}
                <div className="relative group">
                  <button className="p-1 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-8 w-48 bg-gray-800 rounded-lg border border-gray-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    
                    {/* Show manage/delete options only for captains */}
                    {isTeamCaptain(team) ? (
                      <>
                        <button
                          onClick={() => window.location.href = `/team/${team._id}`}
                          className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors flex items-center space-x-2 rounded-t-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Manage Team</span>
                        </button>
                        <button
                          onClick={() => setDeleteModal({ show: true, team })}
                          className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors flex items-center space-x-2 rounded-b-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Team</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => window.location.href = `/team/${team._id}`}
                          className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors flex items-center space-x-2 rounded-t-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Team</span>
                        </button>
                        <button
                          onClick={() => setLeaveModal({ show: true, team })}
                          className="w-full px-4 py-2 text-left text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 transition-colors flex items-center space-x-2 rounded-b-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Leave Team</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Stats */}
              <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg">
                <div className="text-center flex-1">
                  <div className="text-xl font-bold text-blue-400">{team.members?.length || 0}</div>
                  <div className="text-xs text-gray-400">Members</div>
                </div>
                <div className="h-10 w-px bg-white/10"></div>
                <div className="text-center flex-1">
                  <div className="text-xl font-bold text-green-400">{team.statistics?.wins || 0}</div>
                  <div className="text-xs text-gray-400">Wins</div>
                </div>
                <div className="h-10 w-px bg-white/10"></div>
                <div className="text-center flex-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    team.isMatchReady 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-1 ${team.isMatchReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                    {team.isMatchReady ? 'Match Ready' : 'Incomplete'}
                  </span>
                </div>
              </div>

              {/* Team Members Preview - Simple avatar row like first screenshot */}
              {team.members && team.members.length > 0 && (
                <div className="mb-4">
                  <div className="flex -space-x-2 overflow-hidden">
                    {team.members.slice(0, 5).map((member, idx) => {
                      // Get member info from either direct member data or nested userInfo
                      const memberInfo = member.userInfo || member;
                      const memberName = memberInfo.fullName || memberInfo.name || memberInfo.email?.split('@')[0] || `Member ${idx + 1}`;
                      const profileImage = memberInfo.profileImage || member.profileImage;
                      
                      console.log(`MyTeamsTab: Processing member ${idx}:`, {
                        member,
                        memberInfo,
                        memberName,
                        profileImage,
                        hasUserInfo: !!member.userInfo
                      });
                      
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
                              className="w-full h-full object-cover"
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
                        <span className="text-white text-xs font-medium">
                          +{team.members.length - 5}
                        </span>
                        
                        {/* Tooltip for extra members */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                          +{team.members.length - 5} more members
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <div className="mt-4">
                <button 
                  onClick={() => window.location.href = `/team/${team._id}`}
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
          </div>
        ))}
        </div>
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

      {/* Join Team by Code Modal */}
      {showJoinModal && (
        <JoinTeamByCode
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleTeamJoined}
        />
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

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default MyTeamsTab;
