const mongoose = require('mongoose');

const CourtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Location object, can be extended as needed
  location: {
    address: { type: String },
    city: { type: String },
    // Optionally, add coordinates or other fields
  },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  type: { type: String, enum: ['football', 'paddle'], required: true },
  maxPlayersPerTeam: { type: Number, required: true },
  image: { type: String }, // URL or path to image
  description: { type: String },
  amenities: [{ type: String }], // e.g., ['water', 'changing room', 'wifi']
  matchTime: { type: Number }, // in minutes
  surfaceType: { type: String },
  isIndoor: { type: Boolean, default: false },
  // Rating system
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Court', CourtSchema);
