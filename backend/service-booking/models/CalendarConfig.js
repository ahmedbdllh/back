const mongoose = require('mongoose');

const calendarConfigSchema = new mongoose.Schema({
  courtId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'Court'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Company'
  },
  workingHours: {
    monday: {
      isOpen: { type: Boolean, default: true },
      start: { type: String, default: '04:00' },
      end: { type: String, default: '23:30' }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      start: { type: String, default: '04:00' },
      end: { type: String, default: '23:30' }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      start: { type: String, default: '04:00' },
      end: { type: String, default: '23:30' }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      start: { type: String, default: '04:00' },
      end: { type: String, default: '23:30' }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      start: { type: String, default: '04:00' },
      end: { type: String, default: '23:30' }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      start: { type: String, default: '04:00' },
      end: { type: String, default: '23:30' }
    },
    sunday: {
      isOpen: { type: Boolean, default: true },
      start: { type: String, default: '04:00' },
      end: { type: String, default: '23:30' }
    }
  },
  pricing: {
    basePrice: { type: Number, required: true, default: 0 }, // Price per hour - must be set by manager
    peakHours: [{
      day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      startTime: String,
      endTime: String,
      multiplier: { type: Number, default: 1.5 } // Price multiplier for peak hours
    }],
    specialDates: [{
      date: Date,
      price: Number,
      reason: String // e.g., "Holiday surcharge"
    }]
  },
  slotDuration: {
    type: Number,
    default: 90, // Duration in minutes for each booking slot (changed to 90 for paddle courts)
    enum: [15, 30, 45, 60, 90, 120]
  },
  minBookingDuration: {
    type: Number,
    default: 90, // Minimum booking duration in minutes (changed to 90 for paddle courts)
    min: 30
  },
  maxBookingDuration: {
    type: Number,
    default: 180, // Maximum booking duration in minutes
    max: 480
  },
  advanceBookingDays: {
    type: Number,
    default: 30, // How many days in advance can users book
    min: 1,
    max: 365
  },
  cancellationPolicy: {
    allowCancellation: { type: Boolean, default: true },
    cancellationDeadlineHours: { type: Number, default: 24 }, // Hours before booking start time
    refundPercentage: { type: Number, default: 100, min: 0, max: 100 }
  },
  autoConfirmBookings: {
    type: Boolean,
    default: false // If true, bookings are auto-confirmed, otherwise require manual approval
  },
  blockedDates: [{
    date: Date,
    reason: String, // e.g., "Maintenance", "Private event"
    isRecurring: { type: Boolean, default: false },
    recurringType: { type: String, enum: ['weekly', 'monthly', 'yearly'] }
  }],
  courtDetails: {
    name: { type: String, required: true },
    type: { type: String, required: true },
    maxPlayersPerTeam: { type: Number, required: true }
  },
  companyDetails: {
    companyName: String,
    managerEmail: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
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

// Index for better query performance
calendarConfigSchema.index({ courtId: 1 });
calendarConfigSchema.index({ companyId: 1 });

// Pre-save middleware
calendarConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to get working hours for a specific day
calendarConfigSchema.methods.getWorkingHoursForDay = function(dayName) {
  const day = dayName.toLowerCase();
  return this.workingHours[day] || null;
};

// Method to check if a date is blocked
calendarConfigSchema.methods.isDateBlocked = function(date) {
  const dateStr = date.toDateString();
  return this.blockedDates.some(blocked => {
    if (blocked.isRecurring) {
      // Handle recurring blocked dates
      const blockedDate = new Date(blocked.date);
      switch (blocked.recurringType) {
        case 'weekly':
          return date.getDay() === blockedDate.getDay();
        case 'monthly':
          return date.getDate() === blockedDate.getDate();
        case 'yearly':
          return date.getMonth() === blockedDate.getMonth() && date.getDate() === blockedDate.getDate();
        default:
          return false;
      }
    } else {
      return blocked.date.toDateString() === dateStr;
    }
  });
};

// Method to calculate price for a booking
calendarConfigSchema.methods.calculatePrice = function(date, startTime, endTime, court) {
  // Use the base price from the court configuration (set by manager)
  let basePrice = court.pricePerHour || this.pricing.basePrice;

  // Check for special dates (keep this for holiday pricing)
  const specialDate = this.pricing.specialDates.find(special => 
    special.date.toDateString() === date.toDateString()
  );
  
  if (specialDate) {
    basePrice = specialDate.price;
  }

  // Calculate total players using court's maxPlayersPerTeam (set by manager)
  const totalPlayers = (court.maxPlayersPerTeam || 6) * 2;

  // Total price = base price × total players
  return Math.round(basePrice * totalPlayers * 100) / 100; // Round to 2 decimal places
};

module.exports = mongoose.model('CalendarConfig', calendarConfigSchema);
