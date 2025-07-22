const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  courtId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Court' // Reference to court service
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Company' // Reference to company service
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Reference to user/auth service
  },
  // Team booking support
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team', // Reference to team if this is a team booking
    default: null
  },
  bookingType: {
    type: String,
    enum: ['individual', 'team'],
    default: 'individual'
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  duration: {
    type: Number,
    required: true, // Duration in minutes
    min: 30,
    max: 240
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    confirmed: {
      type: Boolean,
      default: false
    }
  }],
  teamSize: {
    type: Number,
    required: true,
    min: 1,
    max: 22
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerHour: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'bank_transfer'],
    default: 'cash'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  cancellationReason: {
    type: String,
    maxlength: 200
  },
  // Court and company details (cached for faster queries)
  courtDetails: mongoose.Schema.Types.Mixed,
  companyDetails: mongoose.Schema.Types.Mixed,
  userDetails: mongoose.Schema.Types.Mixed,
  // Team details (cached for team bookings)
  teamDetails: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ courtId: 1, date: 1, startTime: 1 });
bookingSchema.index({ companyId: 1, date: 1 });
bookingSchema.index({ userId: 1, date: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ date: 1, startTime: 1, endTime: 1 });

// Virtual for formatted date
bookingSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Virtual for booking duration in hours
bookingSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Pre-save middleware to update updatedAt
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if booking conflicts with another booking
bookingSchema.methods.hasConflict = async function(courtId, date, startTime, endTime) {
  const conflictingBooking = await this.constructor.findOne({
    courtId: courtId,
    date: date,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  });
  
  return !!conflictingBooking;
};

// Static method to get available time slots for a court on a specific date
bookingSchema.statics.getAvailableSlots = async function(courtId, date, workingHours = { start: '04:00', end: '23:30' }) {
  const existingBookings = await this.find({
    courtId: courtId,
    date: date,
    status: { $in: ['pending', 'confirmed'] }
  }).sort({ startTime: 1 });

  // Generate all possible time slots (90-minute intervals for paddle courts)
  const slots = [];
  let currentHour = parseInt(workingHours.start.split(':')[0]);
  let currentMinute = parseInt(workingHours.start.split(':')[1]);
  const endHour = parseInt(workingHours.end.split(':')[0]);
  const endMinute = parseInt(workingHours.end.split(':')[1]);

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Calculate the end time for this slot to check if it fits within working hours
    let slotEndHour = currentHour;
    let slotEndMinute = currentMinute + 90;
    
    while (slotEndMinute >= 60) {
      slotEndHour += 1;
      slotEndMinute -= 60;
    }
    
    // Only add slot if it ends within working hours
    if (slotEndHour < endHour || (slotEndHour === endHour && slotEndMinute <= endMinute)) {
      slots.push(timeSlot);
    } else {
      break; // Stop if next slot would exceed working hours
    }
    
    currentMinute += 90; // 90-minute intervals for paddle courts
    while (currentMinute >= 60) {
      currentHour += 1;
      currentMinute -= 60;
    }
    
    // Break if we've exceeded the end time
    if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
      break;
    }
    
    // Prevent infinite loop
    if (currentHour >= 24) {
      break;
    }
  }

  // Filter out booked slots
  const availableSlots = slots.filter(slot => {
    return !existingBookings.some(booking => {
      return slot >= booking.startTime && slot < booking.endTime;
    });
  });

  return availableSlots;
};

module.exports = mongoose.model('Booking', bookingSchema);
