const mongoose = require('mongoose');
// Import User reference model to ensure it's registered before being used
require('./UserReference');

const TeamSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  sport: { 
    type: String, 
    enum: ['Football', 'Paddle', 'Basketball', 'Tennis'], 
    required: true 
  },
  description: { 
    type: String,
    maxlength: 500
  },
  logo: { 
    type: String // URL or path to team logo
  },
  captain: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  members: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    position: { 
      type: String // e.g., 'GK', 'DEF', 'MID', 'ATT'
    },
    x: {
      type: Number // X coordinate for field position (0-100)
    },
    y: {
      type: Number // Y coordinate for field position (0-100)
    },
    isStarter: {
      type: Boolean,
      default: true
    },
    jerseyNumber: { 
      type: Number,
      min: 1,
      max: 99
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    }
  }],
  maxMembers: { 
    type: Number, 
    default: 8,
    min: 2,
    max: 8
  },
  fieldType: {
    type: Number,
    enum: [6, 7],
    default: 6
  },
  formation: {
    type: String // e.g., '1-2-2', '1-3-1', '1-4-2'
  },
  isMatchReady: {
    type: Boolean,
    default: false
  },
  location: {
    city: { type: String },
    region: { type: String }
  },
  achievements: [{
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    type: { 
      type: String, 
      enum: ['tournament', 'league', 'friendly', 'other'],
      default: 'other'
    }
  }],
  statistics: {
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 }
  },
  settings: {
    isPublic: { type: Boolean, default: true },
    allowJoinRequests: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: true },
    secretCode: { 
      type: String, 
      default: null,
      index: true // For faster lookups when joining by code
    }
  },
  joinRequests: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    message: { type: String },
    requestedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  offers: [{
    fromTeam: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
      name: { type: String, required: true },
      logo: { type: String }
    },
    toTeam: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
      name: { type: String, required: true }
    },
    proposedTime: { type: String, required: true }, // e.g., "14:00"
    proposedDate: { type: String, required: true }, // e.g., "2025-08-05"
    court: { type: String, default: 'TBD' },
    sport: { type: String, required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending'
    },
    createdAt: { type: Date, default: Date.now },
    respondedAt: { type: Date }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
TeamSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for team's win rate
TeamSchema.virtual('winRate').get(function() {
  const totalMatches = this.statistics.matchesPlayed;
  if (totalMatches === 0) return 0;
  return Math.round((this.statistics.wins / totalMatches) * 100);
});

// Virtual for current member count
TeamSchema.virtual('currentMembers').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Ensure virtuals are included in JSON output
TeamSchema.set('toJSON', { virtuals: true });

// Check if Team model is already registered to prevent conflicts
if (!mongoose.models.Team) {
  mongoose.model('Team', TeamSchema);
}

module.exports = mongoose.models.Team;
