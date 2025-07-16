const mongoose = require('mongoose');

// Minimal User schema for reference purposes in the Company service.
// This allows Mongoose in this service to understand the 'User' ref for population.
const userSchemaForReference = new mongoose.Schema({
  email: String,
  fullName: String,
 
});


if (!mongoose.models.User) {
  mongoose.model('User', userSchemaForReference);
}

// Exporting is not strictly necessary if the primary goal is to ensure the model
// is registered when this file is required. However, it can be good practice.
module.exports = mongoose.models.User;
