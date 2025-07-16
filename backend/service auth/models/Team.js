const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, 'Please provide a team name'],
    unique: true,
    trim: true,
    minlength: 3
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  joinCode: {
    type: String,
    unique: true
  },
  logo: {
    type: String,
    default: 'uploads/default-team-logo.png'
  }
}, { timestamps: true });

// Pre-save middleware to generate a unique join code
teamSchema.pre('save', function(next) {
  if (this.isNew) {
    // A simple way to generate a random 6-digit code
    this.joinCode = Math.random().toString().slice(2, 8);
  }
  next();
});

// Check if Team model is already registered to prevent conflicts
if (!mongoose.models.Team) {
  mongoose.model('Team', teamSchema);
}

module.exports = mongoose.models.Team;
