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
bookingSchema.statics.getAvailableSlots = async function(courtId, date, workingHours = { start: '04:00', end: '23:30' }, matchDuration = 90) {
  // Create date range for the entire day to catch all bookings for that date
  const searchDate = new Date(date);
  const startOfDay = new Date(searchDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(searchDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const existingBookings = await this.find({
    courtId: courtId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: 'confirmed' // Only check confirmed bookings since we removed pending status
  }).sort({ startTime: 1 });
  
  // Only log if there are bookings to help debug conflicts
  if (existingBookings.length > 0) {
    console.log(`📋 ${existingBookings.length} existing bookings found for ${searchDate.toDateString()}`);
  }

  // Check if the selected date is today
  const today = new Date();
  const selectedDate = new Date(date);
  const isToday = selectedDate.toDateString() === today.toDateString();
  
  // Get current time in minutes for filtering past slots
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Generate all possible time slots using the court's match duration
  const slots = [];
  let slotHour = parseInt(workingHours.start.split(':')[0]);
  let slotMinute = parseInt(workingHours.start.split(':')[1]);
  const endHour = parseInt(workingHours.end.split(':')[0]);
  const endMinute = parseInt(workingHours.end.split(':')[1]);

  while (slotHour < endHour || (slotHour === endHour && slotMinute <= endMinute)) {
    const timeSlot = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
    
    // Calculate the end time for this slot to check if it fits within working hours
    let slotEndHour = slotHour;
    let slotEndMinute = slotMinute + matchDuration;
    
    while (slotEndMinute >= 60) {
      slotEndHour += 1;
      slotEndMinute -= 60;
    }
    
    // Only add slot if it ends within working hours
    if (slotEndHour < endHour || (slotEndHour === endHour && slotEndMinute <= endMinute)) {
      // If it's today, only show slots that haven't started yet (add 30 minute buffer)
      if (isToday) {
        const slotStartTimeInMinutes = slotHour * 60 + slotMinute;
        const timeBuffer = 30; // 30 minute buffer - can't book slots starting within 30 minutes
        
        if (slotStartTimeInMinutes > currentTimeInMinutes + timeBuffer) {
          slots.push(timeSlot);
        }
        // Skip past slots
      } else {
        // For future dates, add all slots within working hours
        slots.push(timeSlot);
      }
    } else {
      break; // Stop if next slot would exceed working hours
    }
    
    slotMinute += matchDuration; // Use court's match duration instead of hardcoded 90
    while (slotMinute >= 60) {
      slotHour += 1;
      slotMinute -= 60;
    }
    
    // Break if we've exceeded the end time
    if (slotHour > endHour || (slotHour === endHour && slotMinute > endMinute)) {
      break;
    }
    
    // Prevent infinite loop
    if (slotHour >= 24) {
      break;
    }
  }
  
  // Only log potential slots if there are existing bookings to help debug conflicts
  if (existingBookings.length > 0) {
    console.log(`🎯 Generated ${slots.length} potential slots:`, slots);
  }

  // Filter out booked slots - check if any booking conflicts with the time slot
  const availableSlots = slots.filter(slot => {
    // Calculate end time for this slot
    const [slotHour, slotMin] = slot.split(':').map(Number);
    const slotStartMinutes = slotHour * 60 + slotMin;
    const slotEndMinutes = slotStartMinutes + matchDuration;
    const slotEndHour = Math.floor(slotEndMinutes / 60);
    const slotEndMin = slotEndMinutes % 60;
    const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;
    
    // Check if this slot conflicts with any existing booking
    const isConflicting = existingBookings.some(booking => {
      // Convert booking times to minutes for easier comparison
      const [bookingStartHour, bookingStartMin] = booking.startTime.split(':').map(Number);
      const [bookingEndHour, bookingEndMin] = booking.endTime.split(':').map(Number);
      const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin;
      const bookingEndMinutes = bookingEndHour * 60 + bookingEndMin;
      
      // Check for overlap: slot conflicts with booking if they overlap
      const hasOverlap = (slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes);
      
      if (hasOverlap) {
        console.log(`❌ Slot ${slot}-${slotEndTime} conflicts with booking ${booking.startTime}-${booking.endTime}`);
      }
      
      return hasOverlap;
    });
    
    return !isConflicting;
  });

  // Only log final slots when there are conflicts to help debug
  if (existingBookings.length > 0) {
    console.log(`🏆 Final available slots: ${availableSlots.length} slots:`, availableSlots);
  }
  
  return availableSlots;
};

// Static method to get all time slots with booking status (available/booked)
bookingSchema.statics.getAllSlotsWithStatus = async function(courtId, date, workingHours = { start: '04:00', end: '23:30' }, matchDuration = 90) {
  const existingBookings = await this.find({
    courtId: courtId,
    date: date,
    status: { $in: ['pending', 'confirmed'] }
  }).sort({ startTime: 1 });

  // Generate all possible time slots
  const slots = [];
  let currentHour = parseInt(workingHours.start.split(':')[0]);
  let currentMinute = parseInt(workingHours.start.split(':')[1]);
  const endHour = parseInt(workingHours.end.split(':')[0]);
  const endMinute = parseInt(workingHours.end.split(':')[1]);

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Calculate the end time for this slot
    let slotEndHour = currentHour;
    let slotEndMinute = currentMinute + matchDuration;
    
    while (slotEndMinute >= 60) {
      slotEndHour += 1;
      slotEndMinute -= 60;
    }
    
    const endTimeSlot = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
    
    // Only add slot if it ends within working hours
    if (slotEndHour < endHour || (slotEndHour === endHour && slotEndMinute <= endMinute)) {
      // Check if this slot is booked
      const booking = existingBookings.find(booking => {
        return timeSlot >= booking.startTime && timeSlot < booking.endTime;
      });
      
      slots.push({
        startTime: timeSlot,
        endTime: endTimeSlot,
        duration: matchDuration,
        isAvailable: !booking,
        isBooked: !!booking,
        booking: booking ? {
          id: booking._id,
          status: booking.status,
          teamName: booking.teamDetails?.teamName,
          playerName: booking.userDetails?.name,
          teamSize: booking.teamSize
        } : null
      });
    } else {
      break; // Stop if next slot would exceed working hours
    }
    
    currentMinute += matchDuration;
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

  return slots;
};

module.exports = mongoose.model('Booking', bookingSchema);
