const mongoose = require('mongoose');

// This is a minimal User schema for reference only
// It allows the service-team to work with User references
// The actual User model and data is in the auth service
const userReferenceSchema = new mongoose.Schema({
  email: String,
  username: String,
  fullName: String,
  firstName: String,
  lastName: String,
  role: String,
  profileImage: String
});

// Check if User model is already registered to prevent conflicts
if (!mongoose.models.User) {
  mongoose.model('User', userReferenceSchema);
}

module.exports = mongoose.models.User;
