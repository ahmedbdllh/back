import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeamInvitations = ({ user }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState({});

  // Fetch user's received invitations
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5004/api/teams/invitations/received', {
        headers: { 'x-auth-token': token }
      });
      
      console.log('User invitations loaded:', response.data);
      setInvitations(response.data.invitations || []);
      setError('');
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('Failed to load invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  // Handle accepting invitation
  const handleAcceptInvitation = async (invitationId) => {
    try {
      setProcessing(prev => ({ ...prev, [invitationId]: 'accepting' }));
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5004/api/teams/invitations/${invitationId}/accept`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove the accepted invitation from the list
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
      
      console.log('Invitation accepted successfully');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [invitationId]: null }));
    }
  };

  // Handle declining invitation
  const handleDeclineInvitation = async (invitationId) => {
    try {
      setProcessing(prev => ({ ...prev, [invitationId]: 'declining' }));
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5004/api/teams/invitations/${invitationId}/decline`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove the declined invitation from the list
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
      
      console.log('Invitation declined successfully');
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError('Failed to decline invitation. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [invitationId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-gray-400">Loading invitations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-white mb-2">Error Loading Invitations</h3>
        <p className="text-xs text-gray-400 mb-3">{error}</p>
        <button 
          onClick={fetchInvitations}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-white mb-1">No Pending Invitations</h3>
        <p className="text-xs text-gray-400">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Team Invitations</h3>
        <span className="text-xs text-gray-400 bg-blue-500/20 px-2 py-1 rounded-full">
          {invitations.length} pending
        </span>
      </div>
      
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation._id}
            className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {invitation.team.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{invitation.team.name}</h4>
                  <p className="text-xs text-gray-400">{invitation.team.sport} • {invitation.team.fieldType} vs {invitation.team.fieldType}</p>
                  {invitation.position && (
                    <p className="text-xs text-blue-400">Position: {invitation.position}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    From: {invitation.captain.firstName} {invitation.captain.lastName}
                  </p>
                </div>
              </div>
            </div>
            
            {invitation.message && (
              <p className="text-xs text-gray-300 mt-3 mb-3 italic">
                "{invitation.message}"
              </p>
            )}
            
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => handleAcceptInvitation(invitation._id)}
                disabled={processing[invitation._id]}
                className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {processing[invitation._id] === 'accepting' ? (
                  <>
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Accepting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Accept</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleDeclineInvitation(invitation._id)}
                disabled={processing[invitation._id]}
                className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {processing[invitation._id] === 'declining' ? (
                  <>
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Declining...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Decline</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Invited {new Date(invitation.invitedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamInvitations;
