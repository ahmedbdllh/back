import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getImageUrl, handleImageError } from '../shared/utils/imageUtils';

const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [teamOffers, setTeamOffers] = useState([]);
  const [bookingNotifications, setBookingNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState({});
  const dropdownRef = useRef(null);

  // Fetch notifications (team invitations, join requests, team offers, and booking notifications)
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch team invitations
      const invitationsResponse = await axios.get('http://localhost:5004/api/teams/invitations/received', {
        headers: { 'x-auth-token': token }
      });
      
      // Fetch join requests (for captains)
      const joinRequestsResponse = await axios.get('http://localhost:5004/api/teams/join-requests/received', {
        headers: { 'x-auth-token': token }
      });
      
      // Fetch team offers (for captains)
      try {
        const offersResponse = await axios.get('http://localhost:5004/api/teams/offers/received', {
          headers: { 'x-auth-token': token }
        });
        setTeamOffers(offersResponse.data.offers || []);
      } catch (offerErr) {
        console.warn('Could not fetch team offers:', offerErr);
        setTeamOffers([]);
      }
      
      // Fetch booking notifications (for managers)
      if (user.role === 'Manager' || user.role === 'Admin') {
        try {
          const bookingNotificationsResponse = await axios.get('http://localhost:5005/api/notifications', {
            headers: { 
              'Authorization': `Bearer ${token}`
            }
          });
          setBookingNotifications(bookingNotificationsResponse.data.notifications || []);
        } catch (bookingErr) {
          console.warn('Could not fetch booking notifications:', bookingErr);
          setBookingNotifications([]);
        }
      }
      
      setNotifications(invitationsResponse.data.invitations || []);
      setJoinRequests(joinRequestsResponse.data.joinRequests || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
      setJoinRequests([]);
      setTeamOffers([]);
      setBookingNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle accepting invitation
  const handleAcceptInvitation = async (invitationId) => {
    try {
      setProcessing(prev => ({ ...prev, [invitationId]: 'accepting' }));
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5004/api/teams/invitations/${invitationId}/accept`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove the accepted invitation from the list
      setNotifications(notifications.filter(inv => inv._id !== invitationId));
    } catch (err) {
      console.error('Error accepting invitation:', err);
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
      setNotifications(notifications.filter(inv => inv._id !== invitationId));
    } catch (err) {
      console.error('Error declining invitation:', err);
    } finally {
      setProcessing(prev => ({ ...prev, [invitationId]: null }));
    }
  };

  // Handle approving join request
  const handleApproveJoinRequest = async (teamId, requestId) => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: 'approving' }));
      const token = localStorage.getItem('token');
      
      await axios.post(`http://localhost:5004/api/teams/${teamId}/handle-request`, {
        requestId: requestId,
        action: 'approve'
      }, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove the approved request from the list
      setJoinRequests(joinRequests.filter(req => req._id !== requestId));
    } catch (err) {
      console.error('Error approving join request:', err);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  // Handle rejecting join request
  const handleRejectJoinRequest = async (teamId, requestId) => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));
      const token = localStorage.getItem('token');
      
      await axios.post(`http://localhost:5004/api/teams/${teamId}/handle-request`, {
        requestId: requestId,
        action: 'reject'
      }, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove the rejected request from the list
      setJoinRequests(joinRequests.filter(req => req._id !== requestId));
    } catch (err) {
      console.error('Error rejecting join request:', err);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  // Handle accepting team offer
  const handleAcceptOffer = async (offerId) => {
    try {
      setProcessing(prev => ({ ...prev, [offerId]: 'accepting' }));
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5004/api/teams/offers/${offerId}/accept`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove the accepted offer from the list
      setTeamOffers(teamOffers.filter(offer => offer._id !== offerId));
    } catch (err) {
      console.error('Error accepting offer:', err);
    } finally {
      setProcessing(prev => ({ ...prev, [offerId]: null }));
    }
  };

  // Handle declining team offer
  const handleDeclineOffer = async (offerId) => {
    try {
      setProcessing(prev => ({ ...prev, [offerId]: 'declining' }));
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5004/api/teams/offers/${offerId}/decline`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove the declined offer from the list
      setTeamOffers(teamOffers.filter(offer => offer._id !== offerId));
    } catch (err) {
      console.error('Error declining offer:', err);
    } finally {
      setProcessing(prev => ({ ...prev, [offerId]: null }));
    }
  };

  // Handle marking booking notification as read (delete)
  const markBookingNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await axios.put(`http://localhost:5005/api/notifications/${notificationId}/read`, {}, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Remove the notification from the local state (since it's deleted on backend)
      setBookingNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId)
      );
      
    } catch (err) {
      console.error('Error deleting notification:', err.response?.data || err.message);
    }
  };

  const hasNotifications = notifications.length > 0 || joinRequests.length > 0 || teamOffers.length > 0 || bookingNotifications.length > 0;
  const totalNotifications = notifications.length + joinRequests.length + teamOffers.length + bookingNotifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a5.5 5.5 0 10-11 0L2 17h5m8 0V9a6 6 0 10-12 0v8m8 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Notification Badge */}
        {hasNotifications && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {hasNotifications && (
                <span className="text-xs text-gray-400 bg-blue-500/20 px-2 py-1 rounded-full">
                  {totalNotifications} pending
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                <span className="ml-2 text-gray-400 text-sm">Loading...</span>
              </div>
            ) : !hasNotifications ? (
              <div className="text-center py-8 px-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {/* Team Invitations */}
                {notifications.map((invitation) => {
                  // Safety check for team data
                  const teamName = invitation.team?.name || 'Unknown Team';
                  const teamSport = invitation.team?.sport || 'Unknown Sport';
                  const teamFieldType = invitation.team?.fieldType || 'Unknown';
                  const captainName = invitation.captain?.fullName || 
                                    (invitation.captain?.firstName && invitation.captain?.lastName 
                                      ? `${invitation.captain.firstName} ${invitation.captain.lastName}`
                                      : 'Unknown Captain');
                  
                  return (
                    <div key={invitation._id} className="p-4 hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {teamName.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-white truncate">
                              Team Invitation: {teamName}
                            </h4>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(invitation.invitedAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-400 mb-2">
                            From {captainName} • {teamSport}
                          </p>
                          
                          {invitation.position && (
                            <p className="text-xs text-blue-400 mb-2">
                              Position: {invitation.position}
                            </p>
                          )}
                          
                          {invitation.message && (
                            <p className="text-xs text-gray-300 mb-3 italic">
                              "{invitation.message}"
                            </p>
                          )}
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptInvitation(invitation._id)}
                              disabled={processing[invitation._id]}
                              className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
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
                              className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
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
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Join Requests */}
                {joinRequests.map((request) => {
                  const playerName = request.userInfo?.fullName || 'Unknown Player';
                  
                  return (
                    <div key={request._id} className="p-4 hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {playerName.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-white truncate">
                              Join Request: {request.teamName}
                            </h4>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(request.requestedAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-400 mb-2">
                            From {playerName} • {request.teamSport}
                          </p>
                          
                          {request.message && (
                            <p className="text-xs text-gray-300 mb-3 italic">
                              "{request.message}"
                            </p>
                          )}
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveJoinRequest(request.teamId, request._id)}
                              disabled={processing[request._id]}
                              className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                            >
                              {processing[request._id] === 'approving' ? (
                                <>
                                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Approving...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Approve</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectJoinRequest(request.teamId, request._id)}
                              disabled={processing[request._id]}
                              className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                            >
                              {processing[request._id] === 'rejecting' ? (
                                <>
                                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Rejecting...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span>Reject</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Team Offers */}
                {teamOffers.map((offer) => {
                  const fromTeamName = offer.fromTeam?.name || 'Unknown Team';
                  const sport = offer.sport || 'Unknown Sport';
                  const proposedDate = offer.proposedDate ? new Date(offer.proposedDate).toLocaleDateString() : 'Unknown Date';
                  const proposedTime = offer.proposedTime || 'Unknown Time';
                  const court = offer.court || 'TBD';
                  
                  return (
                    <div key={offer._id} className="p-4 hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          🏆
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-white truncate">
                              Match Offer: {fromTeamName}
                            </h4>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(offer.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-400 mb-2">
                            From {fromTeamName} • {sport}
                          </p>
                          
                          <div className="text-xs text-blue-400 mb-2">
                            <p><strong>⚽ Sport:</strong> {sport}</p>
                            <p><strong>📅 Date:</strong> {proposedDate}</p>
                            <p><strong>⏰ Time:</strong> {proposedTime}</p>
                            <p><strong>🏟️ Court:</strong> {court}</p>
                          </div>
                          
                          {offer.message && (
                            <p className="text-xs text-gray-300 mb-3 italic">
                              "{offer.message}"
                            </p>
                          )}
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptOffer(offer._id)}
                              disabled={processing[offer._id]}
                              className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                            >
                              {processing[offer._id] === 'accepting' ? (
                                <>
                                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Accepting...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Accept Match</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeclineOffer(offer._id)}
                              disabled={processing[offer._id]}
                              className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                            >
                              {processing[offer._id] === 'declining' ? (
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Booking Notifications */}
            {bookingNotifications.length > 0 && (
              <div>
                <div className="px-4 py-2 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-white">Booking Notifications</h3>
                </div>
                
                {bookingNotifications.map((notification) => (
                  <div key={notification._id} className="p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        🏟️
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        
                        {notification.bookingDetails && (
                          <div className="text-xs text-gray-300 mb-2">
                            <p><strong>Court:</strong> {notification.bookingDetails.courtName}</p>
                            <p><strong>Date:</strong> {new Date(notification.bookingDetails.date).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> {notification.bookingDetails.timeSlot}</p>
                            <p><strong>Player:</strong> {notification.bookingDetails.playerName}</p>
                          </div>
                        )}
                        
                        <button
                          onClick={() => markBookingNotificationAsRead(notification._id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
