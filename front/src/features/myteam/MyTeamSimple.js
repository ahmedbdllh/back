import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeamHeader from './components/TeamHeader';

const MyTeamSimple = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [hasTeam, setHasTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinTeamCode, setJoinTeamCode] = useState('');
  const [showJoinTeamInput, setShowJoinTeamInput] = useState(false);

  // Check if user has a team when component mounts
  useEffect(() => {
    checkUserTeam();
  }, []);

  const checkUserTeam = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get('http://localhost:5000/api/teams/my-team', {
        headers: { 'x-auth-token': token }
      });
      
      if (res.data) {
        setTeam(res.data);
        setHasTeam(true);
      }
    } catch (err) {
      console.log('No team found for user');
      setHasTeam(false);
    } finally {
      setLoading(false);
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
      setError('Invalid join code or team not found');
    }
  };

  const handleLeaveTeam = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5000/api/teams/leave', {}, {
        headers: { 'x-auth-token': token }
      });
      setTeam(null);
      setHasTeam(false);
    } catch (err) {
      console.error('Error leaving team:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading your team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-blue-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {hasTeam && team ? (
          // Team exists - show team information
          <div>
            <TeamHeader team={team} onLeaveTeam={handleLeaveTeam} />
            
            {/* Team Details */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Team Info Card */}
              <div className="lg:col-span-2 bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Team Information</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                    <span className="text-neutral-300">Team Name:</span>
                    <span className="text-white font-medium">{team.teamName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                    <span className="text-neutral-300">Sport:</span>
                    <span className="text-white font-medium capitalize">{team.sport}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                    <span className="text-neutral-300">Join Code:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sky-400 font-mono font-bold text-lg">{team.joinCode}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(team.joinCode)}
                        className="p-1 text-neutral-400 hover:text-sky-400 transition-colors"
                        title="Copy join code"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                    <span className="text-neutral-300">Members:</span>
                    <span className="text-white font-medium">{team.members?.length || 1} player{(team.members?.length || 1) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Quick Actions</span>
                </h3>
                
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Invite Players</span>
                  </button>
                  
                  <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Manage Formation</span>
                  </button>
                  
                  <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Schedule Match</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // No team - show create/join options
          <div className="text-center">
            {/* Header */}
            <div className="mb-12">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-sky-500/30 to-blue-600/30 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-sky-500/20">
                <svg className="w-12 h-12 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-neutral-200 bg-clip-text text-transparent">
                Build Your Team
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                Create a new team and invite players to join your championship squad, or join an existing team with a code.
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Create Team Card */}
              <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700 p-8 hover:border-sky-500/50 transition-all duration-300 group">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Create New Team</h3>
                  <p className="text-neutral-400">Start from scratch and build your dream team</p>
                </div>
                
                <div className="space-y-3 mb-6 text-left">
                  <div className="flex items-center space-x-3 text-neutral-300">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Choose team name and sport</span>
                  </div>
                  <div className="flex items-center space-x-3 text-neutral-300">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Upload custom team logo</span>
                  </div>
                  <div className="flex items-center space-x-3 text-neutral-300">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Invite players and set formations</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/create-team')}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-sky-500/30"
                >
                  Create Your Team
                </button>
              </div>

              {/* Join Team Card */}
              <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700 p-8 hover:border-green-500/50 transition-all duration-300 group">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Join Existing Team</h3>
                  <p className="text-neutral-400">Use a team code to join an existing team</p>
                </div>

                {showJoinTeamInput ? (
                  <form onSubmit={handleJoinTeam} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Team Join Code
                      </label>
                      <input
                        type="text"
                        value={joinTeamCode}
                        onChange={(e) => setJoinTeamCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-neutral-600 transition-all text-center font-mono text-lg tracking-wider"
                        maxLength={6}
                        required
                      />
                      {error && (
                        <p className="text-red-400 text-sm mt-2">{error}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowJoinTeamInput(false);
                          setJoinTeamCode('');
                          setError('');
                        }}
                        className="flex-1 bg-neutral-600 hover:bg-neutral-500 text-white font-medium py-3 px-4 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-all"
                      >
                        Join Team
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3 text-left">
                      <div className="flex items-center space-x-3 text-neutral-300">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Get team code from captain</span>
                      </div>
                      <div className="flex items-center space-x-3 text-neutral-300">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Instant team access</span>
                      </div>
                      <div className="flex items-center space-x-3 text-neutral-300">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Start playing immediately</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setShowJoinTeamInput(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/30"
                    >
                      Enter Team Code
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeamSimple;
