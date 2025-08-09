import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Trophy, Calendar, Clock } from 'lucide-react';
import MatchChat from './MatchChat';

const ChatList = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchChats();
    }
  }, [user, isOpen]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5004/api/teams/chats', {
        headers: { 'x-auth-token': token }
      });
      setChats(response.data.chats || []);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getOpponentTeam = (chat, currentUserId) => {
    const participant = chat.participants.find(p => p.userId !== currentUserId);
    return participant ? participant.teamName : 'Unknown Team';
  };

  const getLastMessagePreview = (chat) => {
    if (chat.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage.messageType === 'system') {
        return '🤖 System message';
      }
      return lastMessage.message.length > 50 
        ? lastMessage.message.substring(0, 50) + '...'
        : lastMessage.message;
    }
    return 'No messages yet';
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-lg"
        title="Match Chats"
      >
        <MessageCircle className="w-6 h-6" />
        {chats.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {chats.length > 9 ? '9+' : chats.length}
          </div>
        )}
      </button>

      {/* Chat List Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Match Chats</span>
                </h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  <span className="ml-2 text-gray-400">Loading chats...</span>
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No match chats yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Chats will appear here when match offers are accepted
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {chats.map((chat) => (
                    <div 
                      key={chat.chatId}
                      className="p-4 hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedChatId(chat.chatId);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium text-white truncate">
                              vs {getOpponentTeam(chat, user.id)}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {formatDate(chat.lastActivity)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
                            <span className="flex items-center space-x-1">
                              <Trophy className="w-3 h-3" />
                              <span>{chat.matchDetails.sport}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{chat.matchDetails.proposedDate}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{chat.matchDetails.proposedTime}</span>
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-300 truncate">
                            {getLastMessagePreview(chat)}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              chat.matchDetails.status === 'active' 
                                ? 'bg-green-500/20 text-green-300'
                                : chat.matchDetails.status === 'completed'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {chat.matchDetails.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {chat.messages?.length || 0} messages
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                💡 Click on a chat to start coordinating your match
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Chat */}
      {selectedChatId && (
        <MatchChat 
          chatId={selectedChatId}
          onClose={() => setSelectedChatId(null)}
        />
      )}
    </>
  );
};

export default ChatList;
