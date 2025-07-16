const mongoose = require('mongoose');
// Import User reference model to ensure it's registered before being used
require('./UserReference');

const TeamInvitationSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    type: String, // Suggested position for the player
    required: false
  },
  message: {
    type: String,
    maxlength: 500,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  }
});

// Index for efficient queries
TeamInvitationSchema.index({ invitedPlayer: 1, status: 1 });
TeamInvitationSchema.index({ team: 1, status: 1 });
TeamInvitationSchema.index({ captain: 1 });
TeamInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired invitations

// Check if TeamInvitation model is already registered to prevent conflicts
if (!mongoose.models.TeamInvitation) {
  mongoose.model('TeamInvitation', TeamInvitationSchema);
}

module.exports = mongoose.models.TeamInvitation;
