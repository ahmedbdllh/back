import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Users, Calendar, Clock, MapPin, Trophy } from 'lucide-react';

const MatchChat = ({ chatId, onClose }) => {
  const [chat, setChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChat();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5004/api/teams/chats/${chatId}`, {
        headers: { 'x-auth-token': token }
      });
      setChat(response.data.chat);
    } catch (err) {
      console.error('Error fetching chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      
      await axios.post(`http://localhost:5004/api/teams/chats/${chatId}/messages`, {
        message: newMessage
      }, {
        headers: { 'x-auth-token': token }
      });

      setNewMessage('');
      fetchChat(); // Refresh chat to get new message
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white mt-4">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8">
          <p className="text-white">Chat not found</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {chat.matchDetails.team1.name} vs {chat.matchDetails.team2.name}
                </h2>
                <p className="text-sm text-gray-400">Match Coordination Chat</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          {/* Match Details */}
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <Trophy className="w-4 h-4" />
                <span>{chat.matchDetails.sport}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>{chat.matchDetails.proposedDate}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Clock className="w-4 h-4" />
                <span>{chat.matchDetails.proposedTime}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="w-4 h-4" />
                <span>{chat.matchDetails.court}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.messages.map((message, index) => (
            <div key={index} className={`flex ${message.messageType === 'system' ? 'justify-center' : 'justify-start'}`}>
              {message.messageType === 'system' ? (
                <div className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg text-sm text-center max-w-md">
                  {message.message}
                  <div className="text-xs text-blue-400 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              ) : (
                <div className="max-w-md">
                  <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">
                      {message.senderTeam} Captain
                    </div>
                    <div>{message.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              {sending && <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin"></div>}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            💡 Use this chat to coordinate match details, confirm location, and discuss any changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MatchChat;
