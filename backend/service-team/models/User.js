const mongoose = require('mongoose');

// Simple User model for team service references
// This is a minimal schema just for referencing users from auth service
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Player', 'Manager', 'Admin'],
    default: 'Player'
  },
  profileImage: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Check if User model is already registered to prevent conflicts
if (!mongoose.models.User) {
  mongoose.model('User', UserSchema);
}

module.exports = mongoose.models.User;
