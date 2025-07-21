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
  matchTime: { 
    type: Number, 
    required: true,
    default: 90, // Default duration in minutes
    min: 30, // Minimum 30 minutes
    max: 180, // Maximum 3 hours
    validate: {
      validator: function(v) {
        return v > 0 && v <= 180; // Allow any duration between 1 and 180 minutes
      },
      message: 'Match duration must be between 1 and 180 minutes'
    }
  }, // in minutes - SET by manager, players cannot modify
  
  // Pricing configuration
  pricePerHour: { 
    type: Number, 
    required: false,
    min: 0,
    default: 0
  }, // Price per hour for booking
  
  // Operating hours
  openingTime: { 
    type: String, 
    required: false,
    default: '08:00',
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Opening time must be in HH:MM format'
    }
  },
  closingTime: { 
    type: String, 
    required: false,
    default: '22:00',
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Closing time must be in HH:MM format'
    }
  },
  
  // Schedule configuration
  scheduleConfig: {
    slotDuration: { 
      type: Number, 
      default: 60, // Default slot duration in minutes
      min: 30,
      max: 180
    },
    allowOverlap: { 
      type: Boolean, 
      default: false 
    },
    advanceBookingDays: { 
      type: Number, 
      default: 30 // How many days in advance can bookings be made
    }
  },
  
  // Complete schedule configuration from manager
  schedule: {
    type: Object,
    default: null
  },
  
  // Complete schedule configuration with day-specific working hours
  schedule: {
    workingHours: {
      monday: {
        isOpen: { type: Boolean, default: true },
        start: { type: String, default: '08:00' }, // 24-hour format
        end: { type: String, default: '22:00' }
      },
      tuesday: {
        isOpen: { type: Boolean, default: true },
        start: { type: String, default: '08:00' },
        end: { type: String, default: '22:00' }
      },
      wednesday: {
        isOpen: { type: Boolean, default: true },
        start: { type: String, default: '08:00' },
        end: { type: String, default: '22:00' }
      },
      thursday: {
        isOpen: { type: Boolean, default: true },
        start: { type: String, default: '08:00' },
        end: { type: String, default: '22:00' }
      },
      friday: {
        isOpen: { type: Boolean, default: true },
        start: { type: String, default: '08:00' },
        end: { type: String, default: '22:00' }
      },
      saturday: {
        isOpen: { type: Boolean, default: true },
        start: { type: String, default: '08:00' },
        end: { type: String, default: '22:00' }
      },
      sunday: {
        isOpen: { type: Boolean, default: true },
        start: { type: String, default: '08:00' },
        end: { type: String, default: '22:00' }
      }
    },
    pricing: {
      pricePerMatch: { type: Number, default: 15 },
      advanceBookingPrice: { type: Number, default: 200 },
      matchDuration: { type: Number, default: 90 }
    },
    advanceBookingDays: { type: Number, default: 30 },
    cancellationPolicy: {
      allowCancellation: { type: Boolean, default: true },
      cancellationDeadlineHours: { type: Number, default: 24 },
      refundPercentage: { type: Number, default: 80 }
    },
    blockedDates: [{
      date: { type: Date },
      reason: { type: String },
      isRecurring: { type: Boolean, default: false }
    }]
  },
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
