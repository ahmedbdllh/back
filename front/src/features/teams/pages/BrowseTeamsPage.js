import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [joinRequests, setJoinRequests] = useState({});
  
  const { toasts, success, error: showError, removeToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchPublicTeams();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:5003/api/auth/me', {
        headers: { 'x-auth-token': token }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchPublicTeams = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5004/api/teams/public', {
        headers: {
          'x-auth-token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      } else {
        throw new Error('Failed to fetch public teams');
      }
    } catch (err) {
      console.error('Error fetching public teams:', err);
      setError('Failed to load public teams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (teamId, teamName) => {
    if (!currentUser?.id) {
      showError('Please log in to join a team');
      return;
    }

    // Check if user already has a team
    try {
      const token = localStorage.getItem('token');
      const statusResponse = await fetch(`http://localhost:5004/api/teams/user/me`, {
        headers: { 'x-auth-token': token }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.teams && statusData.teams.length > 0) {
          showError('You are already a member of a team');
          return;
        }
      }
    } catch (err) {
      console.error('Error checking team status:', err);
    }

    setJoinRequests(prev => ({ ...prev, [teamId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5004/api/teams/${teamId}/request-join`, {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        success(`Join request sent to ${teamName}!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send join request');
      }
    } catch (err) {
      console.error('Error sending join request:', err);
      showError(err.message || 'Failed to send join request');
    } finally {
      setJoinRequests(prev => ({ ...prev, [teamId]: false }));
    }
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.sport?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || team.sport?.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
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
            <p className="text-white/60 mt-2">Please wait while we fetch public teams</p>
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
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Browse Public Teams
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
          </div>
        </motion.div>

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
                onClick={fetchPublicTeams}
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
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No public teams are available right now'}
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
                    <button
                      onClick={() => handleJoinRequest(team._id, team.name)}
                      disabled={joinRequests[team._id]}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center gap-2"
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
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default BrowseTeamsPage;
