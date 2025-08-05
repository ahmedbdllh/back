import React, { useState, useEffect } from 'react';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';
import { Avatar } from '../../../shared/ui/components/Avatar';
import { useToast, ToastContainer } from '../../../shared/ui/components/Toast';

export const PublicTeamsModal = ({ isOpen, onClose, currentUser }) => {
  const [publicTeams, setPublicTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [joinRequests, setJoinRequests] = useState({});
  
  // Toast hook
  const { toasts, success, error: showError, info, removeToast } = useToast();

  // Check if user is already in a team
  const checkUserTeamStatus = async () => {
    if (!currentUser?.id) return false;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5003/api/teams/user/${currentUser.id}/status`, {
        headers: {
          'x-auth-token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.hasTeam || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking user team status:', error);
      return false;
    }
  };

  // Fetch public teams
  const fetchPublicTeams = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5003/api/teams/public', {
        headers: {
          'x-auth-token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPublicTeams(data.teams || []);
      } else {
        throw new Error('Failed to fetch public teams');
      }
    } catch (error) {
      console.error('Error fetching public teams:', error);
      setError('Failed to load public teams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send join request
  const handleJoinRequest = async (teamId) => {
    if (!currentUser?.id) {
      showError('You must be logged in to join a team');
      return;
    }

    // Check if user already has a team
    const hasTeam = await checkUserTeamStatus();
    if (hasTeam) {
      showError('You are already part of a team');
      return;
    }

    try {
      setJoinRequests(prev => ({ ...prev, [teamId]: 'pending' }));
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5003/api/teams/${teamId}/join-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({
          playerId: currentUser.id,
          message: 'I would like to join your team'
        }),
      });

      if (response.ok) {
        setJoinRequests(prev => ({ ...prev, [teamId]: 'sent' }));
        success('Join request sent successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send join request');
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      setJoinRequests(prev => ({ ...prev, [teamId]: 'error' }));
      showError(error.message || 'Failed to send join request');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPublicTeams();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
        <div className="bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-neutral-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Look for a Team</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                <span className="ml-3 text-neutral-300">Loading teams...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-400 mb-4">{error}</div>
                <button
                  onClick={fetchPublicTeams}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : publicTeams.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-neutral-400 mb-4">No public teams available at the moment.</div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {publicTeams.map((team) => (
                  <div key={team._id} className="bg-neutral-700 rounded-lg p-6 hover:bg-neutral-600 transition-colors">
                    {/* Team Header */}
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-600 flex-shrink-0">
                        <img
                          src={getImageUrl(team.teamImage, 'team')}
                          alt={team.name}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, 'team', team.name)}
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{team.name}</h3>
                        <p className="text-neutral-300 text-sm">{team.sport || 'Multi-sport'}</p>
                        <p className="text-neutral-400 text-xs">{team.location || 'Location not specified'}</p>
                      </div>
                    </div>

                    {/* Team Description */}
                    {team.description && (
                      <p className="text-neutral-300 text-sm mb-4 line-clamp-3">
                        {team.description}
                      </p>
                    )}

                    {/* Team Stats */}
                    <div className="flex justify-between items-center mb-4 text-sm">
                      <div className="flex space-x-4">
                        <div className="text-center">
                          <div className="text-white font-semibold">{team.members?.length || 0}</div>
                          <div className="text-neutral-400 text-xs">Members</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">{team.matchesPlayed || 0}</div>
                          <div className="text-neutral-400 text-xs">Matches</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">{team.wins || 0}</div>
                          <div className="text-neutral-400 text-xs">Wins</div>
                        </div>
                      </div>
                    </div>

                    {/* Team Members Preview */}
                    {team.members && team.members.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm text-neutral-300 mb-2">Team Members:</div>
                        <div className="flex -space-x-2">
                          {team.members.slice(0, 5).map((member, index) => (
                            <Avatar
                              key={member._id || index}
                              src={member.profileImage ? getImageUrl(member.profileImage, 'user') : null}
                              alt={member.fullName || 'Team Member'}
                              size="sm"
                              className="border-2 border-neutral-700"
                              onError={(e) => handleImageError(e, 'user', member.fullName)}
                            />
                          ))}
                          {team.members.length > 5 && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-600 border-2 border-neutral-700 text-xs text-white">
                              +{team.members.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Join Button */}
                    <div className="flex justify-end">
                      {joinRequests[team._id] === 'sent' ? (
                        <button
                          disabled
                          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm cursor-not-allowed opacity-75"
                        >
                          Request Sent
                        </button>
                      ) : joinRequests[team._id] === 'pending' ? (
                        <button
                          disabled
                          className="bg-neutral-600 text-white px-4 py-2 rounded-md text-sm cursor-not-allowed"
                        >
                          Sending...
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinRequest(team._id)}
                          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Request to Join
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};
