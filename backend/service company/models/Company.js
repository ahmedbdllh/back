const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  // Company basic information
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  
  // Reference to User (Manager or Admin) from auth service
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Owner ID is required'],
    ref: 'User' // This references the User model from auth service
  },
  
  // Owner role validation (Manager or Admin only)
  ownerRole: {
    type: String,
    required: [true, 'Owner role is required'],
    enum: ['Manager', 'Admin'],
    validate: {
      validator: function(value) {
        return ['Manager', 'Admin'].includes(value);
      },
      message: 'Owner must be either Manager or Admin'
    }
  },
  
  // Company details
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Address
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'Tunisia'    }
  },
  
  // Location coordinates [latitude, longitude]
  location: {
    type: [Number], // Array of numbers [lat, lng]
    validate: {
      validator: function(value) {
        // Allow null/undefined or valid coordinate array
        if (!value || value.length === 0) return true;
        return Array.isArray(value) && 
               value.length === 2 && 
               value.every(coord => typeof coord === 'number' && 
                          coord >= -180 && coord <= 180);
      },
      message: 'Location must be an array of two numbers [latitude, longitude] within valid ranges'
    },
    default: null
  },
  
  // Business information
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  
  taxId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Company status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
    default: 'Pending'
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verifiedAt: {
    type: Date
  },    // Company logo and images
  logo: {
    type: String, // URL or path to logo image
    default: null // No default logo, will show Building2 icon instead
  },
  
  images: [{
    type: String // Array of image URLs or paths
  }],
  
  // Social media links
  socialMedia: {
    website: String,
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  
  // Business hours
  businessHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: true } }
  },
  
  // Company statistics
  totalFacilities: {
    type: Number,
    default: 0
  },
  
  totalBookings: {
    type: Number,
    default: 0
  },
  
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  totalReviews: {
    type: Number,
    default: 0
  },
  
  // Subscription and payment info
  subscriptionPlan: {
    type: String,
    enum: ['Basic', 'Premium', 'Enterprise'],
    default: 'Basic'
  },
  
  subscriptionExpiry: {
    type: Date
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
companySchema.index({ ownerId: 1 });
companySchema.index({ status: 1 });
companySchema.index({ companyName: 'text', description: 'text' });

// Update the updatedAt field before saving
companySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for full address
companySchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}, ${this.address.country}`;
});

// Method to verify company
companySchema.methods.verifyCompany = function() {
  this.isVerified = true;
  this.verifiedAt = new Date();
  this.status = 'Active';
  return this.save();
};

// Method to suspend company
companySchema.methods.suspendCompany = function() {
  this.status = 'Suspended';
  return this.save();
};

// Static method to find companies by owner
companySchema.statics.findByOwner = function(ownerId) {
  return this.find({ ownerId });
};

// Static method to find verified companies
companySchema.statics.findVerified = function() {
  return this.find({ isVerified: true, status: 'Active' });
};

module.exports = mongoose.model('Company', companySchema);
