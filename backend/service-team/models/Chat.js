const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return this.messageType !== 'system';
    },
    ref: 'User'
  },
  senderName: {
    type: String,
    required: true
  },
  senderTeam: {
    type: String,
    required: function() {
      return this.messageType !== 'system';
    }
  },
  message: {
    type: String,
    required: true,
    maxLength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  messageType: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  }
});

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  matchDetails: {
    team1: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      captain: { type: mongoose.Schema.Types.ObjectId, required: true }
    },
    team2: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      captain: { type: mongoose.Schema.Types.ObjectId, required: true }
    },
    sport: { type: String, required: true },
    proposedDate: { type: String, required: true },
    proposedTime: { type: String, required: true },
    court: { type: String, default: 'TBD' },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active'
    }
  },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, required: true },
    teamName: { type: String, required: true },
    role: { type: String, enum: ['captain'], default: 'captain' }
  }],
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Update lastActivity when messages are added
chatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
  next();
});

// Index for faster queries
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ chatId: 1 });
chatSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
