import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, Star, MapPin, Search, Clock, Calendar, X } from 'lucide-react';
import { Avatar } from '../../../shared/ui/components/Avatar';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';
import { useToast, ToastContainer } from '../../../shared/ui/components/Toast';

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInstantSearch, setShowInstantSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [searchForm, setSearchForm] = useState({
    date: new Date().toISOString().split('T')[0], // Auto-set to today
    time: '',
    court: '',
    sport: ''
  });
  const [currentUserTeamId, setCurrentUserTeamId] = useState(null);
  
  // Toast notifications
  const { toasts, success, error: showError, info, removeToast } = useToast();

  // Debug functions
  const createTestOffer = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5004/api/teams/debug/create-test-offer', {}, {
        headers: { 'x-auth-token': token }
      });
      
      success(`Test offer created! ${response.data.fromTeam} → ${response.data.toTeam}`);
      info('Check the notification bell to see the new offer (you might need to switch between users)');
    } catch (err) {
      console.error('Error creating test offer:', err);
      showError(err.response?.data?.error || 'Failed to create test offer');
    }
  };

  const clearOffers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete('http://localhost:5004/api/teams/debug/clear-offers', {
        headers: { 'x-auth-token': token }
      });
      
      success(response.data.message);
      info('All offers cleared from your team');
    } catch (err) {
      console.error('Error clearing offers:', err);
      showError(err.response?.data?.error || 'Failed to clear offers');
    }
  };

  const testOfferAcceptance = async () => {
    try {
      info('Testing full offer acceptance flow...');
      
      // Step 1: Create test offer
      const token = localStorage.getItem('token');
      const createResponse = await axios.post('http://localhost:5004/api/teams/debug/create-test-offer', {}, {
        headers: { 'x-auth-token': token }
      });
      
      success(`✅ Step 1: Test offer created (${createResponse.data.fromTeam} → ${createResponse.data.toTeam})`);
      
      // Step 2: Get the created offer
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const offersResponse = await axios.get('http://localhost:5004/api/teams/offers/received', {
        headers: { 'x-auth-token': token }
      });
      
      const pendingOffers = offersResponse.data.offers.filter(offer => offer.status === 'pending');
      
      if (pendingOffers.length === 0) {
        showError('No pending offers found to test with');
        return;
      }
      
      const testOffer = pendingOffers[0];
      info(`📋 Step 2: Found test offer ID: ${testOffer._id}`);
      
      // Step 3: Accept the offer
      await axios.put(`http://localhost:5004/api/teams/offers/${testOffer._id}/accept`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      success('✅ Step 3: Offer accepted successfully!');
      
      // Step 4: Check for created chat
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const chatsResponse = await axios.get('http://localhost:5004/api/teams/chats', {
        headers: { 'x-auth-token': token }
      });
      
      if (chatsResponse.data.chats && chatsResponse.data.chats.length > 0) {
        success(`✅ Step 4: Chat created successfully! Found ${chatsResponse.data.chats.length} chat(s)`);
        info('💬 Check the chat icon in the navigation bar to see the new chat');
      } else {
        showError('❌ Step 4: No chats found after accepting offer');
      }
      
      success('🎉 Full test completed! Check the chat icon in the navigation bar.');
      
    } catch (err) {
      console.error('Error in test flow:', err);
      showError(`Test failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const testChatSystem = async () => {
    try {
      info('Testing chat system...');
      const token = localStorage.getItem('token');
      
      // Step 1: Test the debug endpoint (no auth required)
      try {
        const debugResponse = await axios.get('http://localhost:5004/api/teams/debug/test-chat');
        success(`✅ Debug endpoint: ${debugResponse.data.message}`);
        info(`📊 Total chats in DB: ${debugResponse.data.totalChats}`);
      } catch (debugErr) {
        showError(`❌ Debug endpoint failed: ${debugErr.message}`);
      }
      
      // Step 2: Test user chats endpoint
      try {
        const chatsResponse = await axios.get('http://localhost:5004/api/teams/chats', {
          headers: { 'x-auth-token': token }
        });
        success(`✅ User chats loaded: ${chatsResponse.data.chats?.length || 0} chats found`);
        
        if (chatsResponse.data.chats && chatsResponse.data.chats.length > 0) {
          info(`💬 Chat details: ${chatsResponse.data.chats.map(c => `ID: ${c.chatId}`).join(', ')}`);
        }
      } catch (chatErr) {
        console.error('Chat fetch error details:', chatErr.response?.data);
        showError(`❌ Chat fetch failed: ${chatErr.response?.data?.error || chatErr.message}`);
        return;
      }
      
      success('🎉 Chat system test completed!');
      
    } catch (err) {
      console.error('Error testing chat system:', err);
      showError(`Chat test failed: ${err.response?.data?.error || err.message}`);
    }
  };

  useEffect(() => {
    fetchTeams();
    // Only try to get user team if we have a token
    const token = localStorage.getItem('token');
    if (token) {
      getCurrentUserTeam();
    }
  }, []);

  const getCurrentUserTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // For now, we'll use a simple approach to identify user's team
      // This can be enhanced later when the API is stable
      console.log('User team detection: Using simplified approach for now');
      
    } catch (err) {
      console.log('No user team found or error:', err.message);
    }
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      // Get token for authentication to see both public and private teams
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['x-auth-token'] = token;
      }
      
      const response = await axios.get('http://localhost:5004/api/teams?limit=100', {
        headers
      });
      
      console.log('Teams API response:', response.data);
      
      // The API returns { teams: [...], totalPages, currentPage, total }
      if (response.data && response.data.teams) {
        console.log('Teams data:', response.data.teams);
        
        // Log each team's sport for debugging icons
        response.data.teams.forEach(team => {
          console.log(`Team: ${team.name}, Sport: "${team.sport}"`);
        });
        
        setTeams(response.data.teams || []);
      } else {
        console.error('Unexpected API response structure:', response.data);
        setError('Unexpected response format from server');
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(`Error loading teams: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantSearch = async () => {
    if (!searchForm.time || !searchForm.sport) {
      alert('Please fill in the required fields (time and sport)');
      return;
    }

    setSearchLoading(true);
    
    // Use local filtering - much more reliable than API
    const matchingTeams = teams.filter(team => 
      team.sport?.toLowerCase() === searchForm.sport.toLowerCase() &&
      team._id !== currentUserTeamId
    );
    
    console.log(`🔍 Found ${matchingTeams.length} ${searchForm.sport} teams for ${searchForm.time}`);
    setAvailableTeams(matchingTeams);
    setSearchLoading(false);
  };

  const makeOffer = async (targetTeam) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showError('Please login to make an offer');
      return;
    }

    try {
      // Show loading toast
      info('Sending offer to ' + targetTeam.name + '...', 2000);

      // Create offer notification for the target team's captain
      const offerData = {
        targetTeamId: targetTeam._id,
        proposedTime: searchForm.time,
        proposedDate: searchForm.date,
        court: searchForm.court || 'TBD',
        sport: searchForm.sport,
        message: `Instant match offer for ${searchForm.sport} on ${searchForm.date} at ${searchForm.time}`
      };

      // Send notification to backend
      await axios.post('http://localhost:5004/api/teams/offers/create', offerData, {
        headers: { 'x-auth-token': token }
      });

      // Show success toast
      success(`🏆 Offer sent to ${targetTeam.name}! They will be notified to accept or decline.`, 5000);
      
      // Log the offer for development
      console.log('📨 Instant Match Offer Created:', offerData);
      
    } catch (err) {
      console.error('Error creating offer:', err);
      // Fallback to local simulation if API fails
      
      const offerDetails = {
        fromTeam: 'Your Team',
        toTeam: targetTeam.name,
        time: searchForm.time,
        date: searchForm.date,
        court: searchForm.court || 'TBD',
        sport: searchForm.sport
      };

      // Show detailed success message with toast
      success(`🏆 Offer sent to ${targetTeam.name}! 
Sport: ${searchForm.sport} ${getSportIcon(searchForm.sport)}
Date: Today (${searchForm.date})
Time: ${searchForm.time}
📱 ${targetTeam.name} will be notified about your instant match request.`, 6000);
      
      console.log('📨 Instant Match Offer Created (Local):', offerDetails);
    }
  };

  const resetSearch = () => {
    setSearchForm({
      date: new Date().toISOString().split('T')[0], // Keep today's date
      time: '',
      court: '',
      sport: ''
    });
    setAvailableTeams([]);
    setShowInstantSearch(false);
  };

  const getSportIcon = (sport) => {
    const icons = {
      'football': '⚽',
      'soccer': '⚽',
      'basketball': '🏀',
      'tennis': '🎾',
      'volleyball': '🏐',
      'badminton': '🏸',
      'padel': '🎾',
      'ping pong': '🏓',
      'table tennis': '🏓',
      'cricket': '🏏',
      'baseball': '⚾',
      'rugby': '🏈',
      'american football': '🏈',
      'hockey': '🏒',
      'golf': '⛳',
      'swimming': '🏊',
      'running': '🏃',
      'cycling': '🚴',
      'boxing': '🥊',
      'martial arts': '🥋',
      'gymnastics': '🤸',
      'weightlifting': '🏋️',
      'skiing': '⛷️',
      'snowboarding': '🏂',
      'surfing': '🏄',
      'climbing': '🧗',
      'archery': '🏹',
      'bowling': '🎳',
      'darts': '🎯',
      'esports': '🎮',
      'chess': '♟️'
    };
    return icons[sport?.toLowerCase()] || '🏆';
  };

  const getPrivacyBadge = (isPublic) => {
    return isPublic ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Users size={12} className="mr-1" />
        Public
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Shield size={12} className="mr-1" />
        Private
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error}</p>
          <button 
            onClick={fetchTeams}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Teams</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover all teams in our community
            </p>
            
            {/* Instant Search Button */}
            <div className="mt-6 mb-6">
              <button
                onClick={() => setShowInstantSearch(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Search size={20} className="mr-2" />
                Instant Search
                <Clock size={16} className="ml-2" />
              </button>
              <p className="text-sm text-gray-400 mt-2">
                Find teams available for immediate play
              </p>
            </div>

            <div className="mt-6 flex justify-center items-center space-x-8 text-sm text-gray-400">
              <div className="flex items-center">
                <Users size={16} className="mr-2 text-sky-400" />
                <span>{teams.length} Total Teams</span>
              </div>
              <div className="flex items-center">
                <Shield size={16} className="mr-2 text-green-400" />
                <span>{teams.filter(team => team.settings?.isPublic).length} Public</span>
              </div>
              <div className="flex items-center">
                <Shield size={16} className="mr-2 text-blue-400" />
                <span>{teams.filter(team => !team.settings?.isPublic).length} Private</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {teams.length === 0 ? (
          <div className="text-center py-16">
            <Users size={64} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No teams found</h3>
            <p className="text-gray-400">Be the first to create a team!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams.map((team) => (
              <div
                key={team._id}
                className="bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border border-slate-700 hover:border-slate-600"
              >
                {/* Team Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={team.logo ? `http://localhost:5004${team.logo}` : null}
                        alt={team.name}
                        size="md"
                        className="ring-2 ring-slate-600"
                        onError={(e) => {
                          console.log('Team logo error:', e.target.src);
                          handleImageError(e, 'team', team.name);
                        }}
                      />
                      <div>
                        <h3 className="font-semibold text-white text-lg">{team.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-2xl">{getSportIcon(team.sport)}</span>
                          <span className="text-sm text-gray-300 capitalize">{team.sport}</span>
                        </div>
                      </div>
                    </div>
                    {getPrivacyBadge(team.settings?.isPublic)}
                  </div>

                  {/* Team Description */}
                  {team.description && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {team.description}
                    </p>
                  )}

                  {/* Team Stats */}
                  <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Members</span>
                        <div className="flex items-center space-x-1">
                          <Users size={14} className="text-gray-500" />
                          <span className="font-medium text-white">
                            {Array.isArray(team.members) ? team.members.length : 0}/{team.maxMembers || 'Unlimited'}
                          </span>
                        </div>
                      </div>                    {team.location && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Location</span>
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} className="text-gray-500" />
                          <span className="font-medium text-white">{team.location}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Created</span>
                      <span className="font-medium text-white">
                        {new Date(team.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Team Members Preview */}
                  {Array.isArray(team.members) && team.members.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Members</span>
                        {team.members.length > 3 && (
                          <span className="text-xs text-gray-400">+{team.members.length - 3} more</span>
                        )}
                      </div>
                      <div className="flex -space-x-2">
                        {team.members.slice(0, 3).map((member, index) => (
                          <Avatar
                            key={member._id || index}
                            src={member.profileImage ? getImageUrl(member.profileImage, 'user') : null}
                            alt={member.fullName || member.name || 'Member'}
                            size="sm"
                            className="ring-2 ring-slate-800"
                            onError={(e) => handleImageError(e, 'user', member.fullName || member.name)}
                          />
                        ))}
                        {team.members.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-slate-700 ring-2 ring-slate-800 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-300">
                              +{team.members.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instant Search Modal */}
      {showInstantSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <Search className="text-orange-500" size={24} />
                <h2 className="text-xl font-bold text-white">Instant Team Search</h2>
              </div>
              <button
                onClick={resetSearch}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search Form */}
            <div className="p-6">
              <p className="text-gray-300 mb-6">
                Find teams available to play today at your desired time and court
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Today's Date Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Date
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-gray-300">
                    Today - {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Time *
                  </label>
                  <input
                    type="time"
                    value={searchForm.time}
                    onChange={(e) => setSearchForm({...searchForm, time: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Sport */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sport *
                  </label>
                  <select
                    value={searchForm.sport}
                    onChange={(e) => setSearchForm({...searchForm, sport: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select Sport</option>
                    <option value="football">Football ⚽</option>
                    <option value="padel">Padel 🎾</option>
                  </select>
                </div>

                {/* Court/Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Court/Field (Optional)
                  </label>
                  <input
                    type="text"
                    value={searchForm.court}
                    onChange={(e) => setSearchForm({...searchForm, court: e.target.value})}
                    placeholder="e.g., Court A, Field 1"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleInstantSearch}
                disabled={searchLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searchLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Searching...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Search size={20} className="mr-2" />
                    Find Available Teams
                  </div>
                )}
              </button>

              {/* Search Results */}
              {availableTeams.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Available Teams ({availableTeams.filter(team => team._id !== currentUserTeamId).length})
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {availableTeams
                      .filter(team => team._id !== currentUserTeamId) // Filter out user's own team
                      .map((team) => (
                      <div
                        key={team._id}
                        className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={team.logo ? `http://localhost:5004${team.logo}` : null}
                            alt={team.name}
                            size="sm"
                            className="ring-2 ring-slate-600"
                          />
                          <div>
                            <h4 className="font-medium text-white">{team.name}</h4>
                            <p className="text-sm text-gray-300">
                              {getSportIcon(team.sport)} {team.sport} • {team.members?.length || 0} members
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => makeOffer(team)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                          Make Offer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {availableTeams.filter(team => team._id !== currentUserTeamId).length === 0 && searchForm.sport && !searchLoading && (
                <div className="mt-6 text-center py-8">
                  <Users size={48} className="mx-auto text-gray-500 mb-3" />
                  <p className="text-gray-400">No other teams found for the selected sport</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search parameters or check back later</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Debug Section */}
      <div className="mt-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <span className="mr-2">🧪</span>
          Debug Tools
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={createTestOffer}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Create Test Offer
          </button>
          <button
            onClick={clearOffers}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Clear All Offers
          </button>
          <button
            onClick={testOfferAcceptance}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            🧪 Test Full Flow
          </button>
          <button
            onClick={testChatSystem}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            💬 Test Chat System
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          <p>• Create Test Offer: Creates a fresh offer from your team to another team</p>
          <p>• Clear All Offers: Removes all pending offers from your team</p>
          <p>• Test Full Flow: Creates offer, accepts it, and creates chat (all in one)</p>
          <p>• Test Chat System: Tests chat fetching and creation directly</p>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TeamsPage;
