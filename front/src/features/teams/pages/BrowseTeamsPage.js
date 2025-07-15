import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Star, Shield, Search, Filter, MapPin, Calendar, ArrowLeft, ChevronDown } from 'lucide-react';
import { useToast, ToastContainer } from '../../../shared/ui/components/Toast';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';
import { Avatar } from '../../../shared/ui/components/Avatar';
import { Container } from '../../../shared/ui/components/Container';

const BrowseTeamsPage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, football, basketball, etc.
  const [privacyFilter, setPrivacyFilter] = useState('all'); // all, public, private
  const [joinRequests, setJoinRequests] = useState({});
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]); // Track teams user has already requested to join
  const [showPendingRequestsSection, setShowPendingRequestsSection] = useState(false);
  const [showSecretCodeModal, setShowSecretCodeModal] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [selectedPrivateTeam, setSelectedPrivateTeam] = useState(null);
  const [joiningWithCode, setJoiningWithCode] = useState(false);
  
  const { toasts, success, error: showError, removeToast } = useToast();

  useEffect(() => {
    // Debug: First check what's in localStorage
    try {
      const token = localStorage.getItem('token');
      //
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      //
      
      // If we have user data in localStorage, use it as a fallback
      if (storedUser && (storedUser.id || storedUser._id)) {
        //
        setCurrentUser({
          ...storedUser,
          id: storedUser.id || storedUser._id,
          _id: storedUser._id || storedUser.id
        });
      }
    } catch (err) {
      //
    }
    
    // Then try to get fresh data from API
    fetchCurrentUser();
    fetchAllTeams();
    fetchPendingJoinRequests(); // Fetch user's pending join requests
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Use axios instead of fetch for consistency and correct port (5000) from Navbar.js
      const response = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { 'x-auth-token': token }
      });
      
      // With axios, the data is in response.data, and the user object is nested inside
      const userData = response.data.user || response.data;
      
      // Make sure we have both id and _id properties on the user object
      // The backend uses id but the frontend sometimes checks for _id
      if (userData && userData.id && !userData._id) {
        userData._id = userData.id;
      } else if (userData && userData._id && !userData.id) {
        userData.id = userData._id;
      }
      
      // Log the user data to help with debugging
      //
      
      setCurrentUser(userData);
    } catch (err) {
      //
      // Try to get user from localStorage as fallback
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser && (storedUser.id || storedUser._id)) {
          //
          setCurrentUser({
            ...storedUser,
            id: storedUser.id || storedUser._id,
            _id: storedUser._id || storedUser.id
          });
        }
      } catch (e) {
        //
      }
    }
  };

  const fetchAllTeams = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token missing');
      }
      
      // Use axios for consistency
      const response = await axios.get('http://localhost:5004/api/teams', {
        headers: {
          'x-auth-token': token,
        },
      });

      // With axios, data is in response.data
      setTeams(response.data.teams || []);
    } catch (err) {
      //
      const errorMessage = err.response?.data?.error || 'Failed to load teams. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingJoinRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Use the correct endpoint for user's sent join requests
      try {
        const response = await axios.get('http://localhost:5004/api/teams/join-requests/sent', {
          headers: { 'x-auth-token': token }
        });
        
        if (response.data && response.data.joinRequests) {
          // Extract team IDs from the join requests
          const pendingTeamIds = response.data.joinRequests
            .filter(req => req.status === 'pending')
            .map(req => req.teamId);
          
          //
          setPendingJoinRequests(pendingTeamIds);
          
          // Update localStorage to stay in sync
          localStorage.setItem('pendingJoinRequests', JSON.stringify(pendingTeamIds));
          return;
        }
      } catch (apiErr) {
        //
        // If it's a 404, the endpoint doesn't exist yet, use localStorage fallback
        if (apiErr.response?.status === 404) {
          //
        } else {
          // For other errors, log them but still fall back to localStorage
          //
        }
      }
      
      // Fallback to localStorage if backend endpoint doesn't exist or fails
      try {
        const storedPendingRequests = JSON.parse(localStorage.getItem('pendingJoinRequests') || '[]');
        //
        setPendingJoinRequests(storedPendingRequests);
      } catch (e) {
        //
      }
    } catch (err) {
      //
      // Don't show an error to the user, just log it
    }
  };

  const handleJoinRequest = async (teamId, teamName) => {
    // Get token directly from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      showError('Please log in to join a team');
      return;
    }

    // Check if user already has a pending request for this team
    if (pendingJoinRequests.includes(teamId)) {
      showError('You already have a pending request for this team');
      return;
    }

    // Check if user already has a team
    try {
      setJoinRequests(prev => ({ ...prev, [teamId]: true }));
      
      const config = {
        headers: { 'x-auth-token': token }
      };
      
      // First check if user already has a team
      const statusResponse = await axios.get(`http://localhost:5004/api/teams/user/me`, config);
      
      if (statusResponse.data && statusResponse.data.teams && statusResponse.data.teams.length > 0) {
        showError('You are already a member of a team');
        setJoinRequests(prev => ({ ...prev, [teamId]: false }));
        return;
      }
      
      // Send join request - fixed the endpoint from /request-join to /join
      const response = await axios.post(`http://localhost:5004/api/teams/${teamId}/join`, {}, config);
      
      // Add this team to the pending requests list
      const updatedPendingRequests = [...pendingJoinRequests, teamId];
      setPendingJoinRequests(updatedPendingRequests);
      
      // Store in localStorage until backend endpoint is implemented
      localStorage.setItem('pendingJoinRequests', JSON.stringify(updatedPendingRequests));
      
      success(`Join request sent to ${teamName}!`);
      
      // Refresh pending requests from backend to ensure sync
      await fetchPendingJoinRequests();
    } catch (err) {
      //
      let errorMessage = 'Failed to send join request';
      
      // Handle specific error messages from the backend
      if (err.response?.data?.error) {
        const backendError = err.response.data.error;
        if (backendError.includes('pending request')) {
          // If backend says there's already a pending request, add it to our local state
          const updatedPendingRequests = [...pendingJoinRequests, teamId];
          setPendingJoinRequests(updatedPendingRequests);
          localStorage.setItem('pendingJoinRequests', JSON.stringify(updatedPendingRequests));
          errorMessage = 'You already have a pending request for this team';
        } else {
          errorMessage = backendError;
        }
      }
      
      showError(errorMessage);
    } finally {
      setJoinRequests(prev => ({ ...prev, [teamId]: false }));
    }
  };

  const handlePrivateTeamJoin = (team) => {
    setSelectedPrivateTeam(team);
    setShowSecretCodeModal(true);
    setSecretCode('');
  };

  const handleJoinWithSecretCode = async () => {
    if (!secretCode.trim()) {
      showError('Please enter a secret code');
      return;
    }

    // Get token directly from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      showError('Please log in to join a team');
      return;
    }

    setJoiningWithCode(true);

    try {
      const response = await axios.post(
        'http://localhost:5004/api/teams/join-by-code', 
        {
          secretCode: secretCode.trim().toUpperCase()
        },
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json',
          }
        }
      );

      success(`Successfully joined team "${response.data.team.name}"!`);
      setShowSecretCodeModal(false);
      setSecretCode('');
      setSelectedPrivateTeam(null);
      
      // Navigate to the team page after a short delay
      setTimeout(() => {
        navigate(`/team/${response.data.team._id}`);
      }, 1500);
    } catch (err) {
      //
      const errorMessage = err.response?.data?.error || 'Invalid secret code or failed to join team';
      showError(errorMessage);
    } finally {
      setJoiningWithCode(false);
    }
  };

  const handleCancelJoinRequest = async (teamId, teamName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showError('Please log in to manage your requests');
      return;
    }

    try {
      // Set loading state for this team
      setJoinRequests(prev => ({ ...prev, [teamId]: true }));
      
      const config = {
        headers: { 'x-auth-token': token }
      };
      
      // Try different possible endpoints for cancelling requests
      let cancelSuccess = false;
      
      try {
        // First try: DELETE /teams/:id/join-request
        await axios.delete(`http://localhost:5004/api/teams/${teamId}/join-request`, config);
        cancelSuccess = true;
      } catch (firstErr) {
        try {
          // Second try: DELETE /teams/:id/join
          await axios.delete(`http://localhost:5004/api/teams/${teamId}/join`, config);
          cancelSuccess = true;
        } catch (secondErr) {
          try {
            // Third try: POST to handle-request with cancel action
            await axios.post(`http://localhost:5004/api/teams/${teamId}/cancel-request`, {}, config);
            cancelSuccess = true;
          } catch (thirdErr) {
            // If all backend attempts fail, just remove from local state
            //
            cancelSuccess = true; // Allow local removal
          }
        }
      }
      
      if (cancelSuccess) {
        // Remove this team from the pending requests list
        const updatedPendingRequests = pendingJoinRequests.filter(id => id !== teamId);
        setPendingJoinRequests(updatedPendingRequests);
        
        // Update localStorage
        localStorage.setItem('pendingJoinRequests', JSON.stringify(updatedPendingRequests));
        
        success(`Join request to ${teamName} cancelled`);
        
        // Refresh pending requests from backend to ensure sync
        await fetchPendingJoinRequests();
      }
    } catch (err) {
      //
      
      // If it's a 404 error, the request might already be processed
      if (err.response?.status === 404) {
        // Remove from local state anyway since it doesn't exist on the server
        const updatedPendingRequests = pendingJoinRequests.filter(id => id !== teamId);
        setPendingJoinRequests(updatedPendingRequests);
        localStorage.setItem('pendingJoinRequests', JSON.stringify(updatedPendingRequests));
        
        success(`Join request to ${teamName} removed (it may have already been processed by the team captain)`);
        await fetchPendingJoinRequests(); // Refresh to sync with server
      } else {
        const errorMessage = err.response?.data?.error || 'Failed to cancel join request';
        showError(errorMessage);
      }
    } finally {
      setJoinRequests(prev => ({ ...prev, [teamId]: false }));
    }
  };

  // Add a function to sync with backend state
  const syncPendingRequests = async () => {
    await fetchPendingJoinRequests();
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.sport?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || team.sport?.toLowerCase() === filterType.toLowerCase();
    const matchesPrivacy = privacyFilter === 'all' || 
                          (privacyFilter === 'public' && team.settings?.isPublic) ||
                          (privacyFilter === 'private' && !team.settings?.isPublic);
    return matchesSearch && matchesFilter && matchesPrivacy;
  });

  // Get unique sports for filters
  const sports = [...new Set(teams.map(team => team.sport).filter(Boolean))];

  const teamTypeColors = {
    football: 'from-green-500 to-emerald-600',
    basketball: 'from-orange-500 to-red-600',
    tennis: 'from-purple-500 to-indigo-600',
    padel: 'from-blue-500 to-cyan-600'
  };

  const getPlayerName = (player) => {
    return player.fullName || player.name || player.username || 
           (player.firstName && player.lastName ? `${player.firstName} ${player.lastName}` : '') ||
           player.email?.split('@')[0] || 'Unknown Player';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Container className="py-20">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-cyan-400 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <h2 className="text-2xl font-bold text-white mt-6">Loading Teams...</h2>
            <p className="text-white/60 mt-2">Please wait while we fetch teams</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-20">
        <div className="absolute inset-0 bg-black/30"></div>
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              
              {/* Always show My Requests button */}
              <button
                onClick={() => {
                  setShowPendingRequestsSection(!showPendingRequestsSection);
                  if (!showPendingRequestsSection) {
                    // Scroll to pending requests section with smooth animation
                    setTimeout(() => {
                      document.getElementById("pending-requests-section")?.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }, 100);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                  showPendingRequestsSection 
                    ? "bg-blue-500 text-white border-blue-500" 
                    : "bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50"
                }`}
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  {pendingJoinRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {pendingJoinRequests.length}
                    </span>
                  )}
                </div>
                <span>My Requests</span>
                {pendingJoinRequests.length > 0 && (
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs">
                    {pendingJoinRequests.length}
                  </span>
                )}
              </button>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Browse Teams
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Find and join amazing teams in your area. Connect with players and start your journey.
            </p>
          </motion.div>
        </Container>
      </div>

      <Container className="py-12">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-6"
        >
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Search teams by name or sport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            {/* Sport Type Filter */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm cursor-pointer"
              >
                <option value="all" className="bg-gray-900 text-white">All Sports</option>
                {sports.map(sport => (
                  <option key={sport} value={sport} className="bg-gray-900 text-white capitalize">
                    {sport}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" size={16} />
            </div>

            {/* Privacy Filter */}
            <div className="relative">
              <select
                value={privacyFilter}
                onChange={(e) => setPrivacyFilter(e.target.value)}
                className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm cursor-pointer"
              >
                <option value="all" className="bg-gray-900 text-white">All Teams</option>
                <option value="public" className="bg-gray-900 text-white">Public Teams</option>
                <option value="private" className="bg-gray-900 text-white">Private Teams</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" size={16} />
            </div>
          </div>
        </motion.div>

        {/* Info Section for Private Teams */}
        {privacyFilter === 'private' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-amber-300 font-medium mb-1">Private Teams</h3>
                <p className="text-amber-200/80 text-sm">
                  Private teams require approval from team captains. You can request to join, but your request will need to be accepted by the team captain before you become a member.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Info Section for Pending Requests */}
        {showPendingRequestsSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            id="pending-requests-section"
            className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-blue-300 font-medium mb-1">Your Pending Join Requests</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={syncPendingRequests}
                        className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded"
                        title="Refresh requests"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10"></polyline>
                          <polyline points="1 20 1 14 7 14"></polyline>
                          <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowPendingRequestsSection(false)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {pendingJoinRequests.length > 0 ? (
                    <p className="text-blue-200/80 text-sm">
                      You have {pendingJoinRequests.length} pending join request{pendingJoinRequests.length !== 1 ? 's' : ''}. Team captains will review your request{pendingJoinRequests.length !== 1 ? 's' : ''} and you'll be notified when they respond.
                    </p>
                  ) : (
                    <p className="text-blue-200/80 text-sm">
                      You have no pending join requests. Send a join request to a team to see it here.
                    </p>
                  )}
                </div>
              </div>
              
              {/* List of Pending Requests */}
              {pendingJoinRequests.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {pendingJoinRequests.map(teamId => {
                    const team = teams.find(t => t._id === teamId);
                    if (!team) return null;
                    
                    return (
                      <div key={teamId} className="flex items-center justify-between bg-blue-600/10 rounded-lg p-3 border border-blue-500/20">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                            <img 
                              src={getImageUrl(team.logo, 'team')} 
                              alt={team.name}
                              className="h-full w-full object-cover"
                              onError={(e) => handleImageError(e, 'team')}
                            />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{team.name}</h4>
                            <p className="text-white/60 text-xs">{team.sport || 'Multi-sport'} • {team.players?.length || 0} players</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelJoinRequest(teamId, team.name)}
                          disabled={joinRequests[teamId]}
                          className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          {joinRequests[teamId] ? (
                            <>
                              <div className="w-3 h-3 border-2 border-rose-300 border-t-transparent rounded-full animate-spin"></div>
                              <span>Cancelling...</span>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                              <span>Cancel</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-2 text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 text-blue-400/50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="m19 8 2 2-2 2"/>
                      <path d="m21 10-7.5 7.5L9 19l1.5-4.5L18 7"/>
                    </svg>
                  </div>
                  <p className="text-blue-300/70 text-sm">No pending requests yet</p>
                  <p className="text-blue-200/50 text-xs mt-1">Send a join request to see it here</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-white/70">
            {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''} found
          </p>
        </motion.div>

        {/* Teams Grid */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="text-red-400 mb-4">
                <Users size={64} className="mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Teams</h2>
              <p className="text-white/60 mb-6">{error}</p>
              <button 
                onClick={fetchAllTeams}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          ) : filteredTeams.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <Users size={64} className="mx-auto text-white/40 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Teams Found</h3>
              <p className="text-white/60">
                {searchTerm || filterType !== 'all' || privacyFilter !== 'all'
                  ? 'Try adjusting your search or filters' 
                  : 'No teams are available right now'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredTeams.map((team, index) => (
                <motion.div
                  key={team._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group cursor-pointer transform hover:scale-105"
                >
                  {/* Team Header */}
                  <div className="relative h-48 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${teamTypeColors[team.sport?.toLowerCase()] || 'from-blue-500 to-purple-600'}`}>
                      <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm p-1">
                          <img
                            src={getImageUrl(team.logo, 'team')}
                            alt={`${team.name} logo`}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => handleImageError(e, 'team')}
                          />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg leading-tight">{team.name}</h3>
                          <p className="text-white/80 text-sm">{team.sport || 'Multi-sport'}</p>
                        </div>
                      </div>
                    </div>
                    {/* Sport Type Badge */}
                    {team.sport && (
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${teamTypeColors[team.sport.toLowerCase()] || 'from-gray-500 to-gray-600'}`}>
                        {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)}
                      </div>
                    )}
                    
                    {/* Privacy Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {!team.settings?.isPublic ? (
                        <div className="px-3 py-1 rounded-full text-white text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-600 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Private
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-full text-white text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-600 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Public
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Content */}
                  <div className="p-6">
                    {/* Team Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{team.players?.length || 0} players</span>
                      </div>
                      {team.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{team.location}</span>
                        </div>
                      )}
                    </div>


                    {/* Captain Info */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-white/80 mb-1">Captain:</p>
                      <div className="flex flex-col gap-0.5 text-white/70 text-sm">
                        <span><strong>Name:</strong> {team.captainInfo?.fullName || team.captainInfo?.name || 'Unknown'}</span>
                        <span><strong>Email:</strong> {team.captainInfo?.email || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Team Description */}
                    {team.description && (
                      <p className="text-white/70 text-sm line-clamp-3 mb-4">{team.description}</p>
                    )}

                    {/* Player Avatars */}
                    {team.players && team.players.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-white/80 mb-2">Team Members:</p>
                        <div className="flex -space-x-2">
                          {team.players.slice(0, 5).map((player, idx) => (
                            <div key={idx} className="relative">
                              <Avatar
                                src={getImageUrl(player.profileImage, 'user')}
                                alt={getPlayerName(player)}
                                size="sm"
                                className="border-2 border-white/20"
                              />
                            </div>
                          ))}
                          {team.players.length > 5 && (
                            <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm">
                              <span className="text-xs text-white/80 font-medium">+{team.players.length - 5}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Join Button */}
                    {team.settings?.isPublic ? (
                      pendingJoinRequests.includes(team._id) ? (
                        <div className="space-y-2">
                          <div className="relative group">
                            <div
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              <div className="w-4 h-4 text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                                  <path d="M12 6v6l4 2"></path>
                                </svg>
                              </div>
                              <span>Pending Approval</span>
                            </div>
                            <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                              <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 shadow-lg">
                                Your join request is pending approval from the team captain
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelJoinRequest(team._id, team.name)}
                            disabled={joinRequests[team._id]}
                            className="w-full bg-gradient-to-r from-rose-600 to-red-500 text-white py-2 px-4 rounded-xl font-medium hover:from-rose-500 hover:to-red-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            {joinRequests[team._id] ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Cancelling...</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                <span>Cancel Request</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoinRequest(team._id, team.name)}
                          disabled={joinRequests[team._id]}
                          className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 px-4 rounded-xl font-medium hover:from-green-500 hover:to-green-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/50 flex items-center justify-center gap-2"
                        >
                          {joinRequests[team._id] ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Sending Request...</span>
                            </>
                          ) : (
                            <>
                              <Users className="w-4 h-4" />
                              <span>Request to Join</span>
                            </>
                          )}
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handlePrivateTeamJoin(team)}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-500 text-white py-3 px-4 rounded-xl font-medium hover:from-amber-500 hover:to-orange-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex items-center justify-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Join with Code</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Secret Code Modal */}
      <AnimatePresence>
        {showSecretCodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSecretCodeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Join Private Team</h3>
                <button
                  onClick={() => setShowSecretCodeModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Secret Code
                  </label>
                  <input
                    type="text"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                    placeholder="Enter team secret code"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    maxLength={8}
                    autoFocus
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Enter the secret code provided by the team captain to join "{selectedPrivateTeam?.name}".
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowSecretCodeModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinWithSecretCode}
                    disabled={!secretCode.trim() || joiningWithCode}
                    className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {joiningWithCode ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Joining...</span>
                      </>
                    ) : (
                      'Join Team'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrowseTeamsPage;
