const express = require('express');
const router = express.Router();
const moment = require('moment');
const axios = require('axios');
const Booking = require('../models/Booking');
const CalendarConfig = require('../models/CalendarConfig');
const { verifyToken, verifyUser, isCompanyManager } = require('../middleware/auth');

// Service URLs
const COURT_SERVICE_URL = process.env.COURT_SERVICE_URL || 'http://localhost:5003';
const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://localhost:5001';

// @route   GET /api/calendar/:courtId
// @desc    Get calendar for a specific court
// @access  Public
router.get('/:courtId', async (req, res) => {
  try {
    const { courtId } = req.params;
    const { month, year } = req.query;

    // Get court details
    const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
    const court = courtResponse.data;
    
    if (!court || !court._id) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    // Get calendar configuration
    let calendarConfig = await CalendarConfig.findOne({ courtId });
    if (!calendarConfig) {
      try {
        // Get company details for default config
        const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${court.companyId}`);
        
        // Create default calendar config
        calendarConfig = new CalendarConfig({
          courtId,
          companyId: court.companyId,
          courtDetails: {
            name: court.name,
            type: court.type,
            maxPlayersPerTeam: court.maxPlayersPerTeam
          },
          companyDetails: {
            companyName: companyResponse.data.companyName,
            managerEmail: companyResponse.data.managerEmail
          }
        });
        await calendarConfig.save();
      } catch (saveError) {
        // If there's a validation error, delete any existing config and try again
        if (saveError.name === 'ValidationError') {
          await CalendarConfig.deleteOne({ courtId });
          
          // Get company details for default config
          const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${court.companyId}`);
          
          // Create default calendar config
          calendarConfig = new CalendarConfig({
            courtId,
            companyId: court.companyId,
            courtDetails: {
              name: court.name,
              type: court.type,
              maxPlayersPerTeam: court.maxPlayersPerTeam
            },
            companyDetails: {
              companyName: companyResponse.data.companyName,
              managerEmail: companyResponse.data.managerEmail
            }
          });
          await calendarConfig.save();
        } else {
          throw saveError;
        }
      }
    }

    // Calculate month range
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    // Get all bookings for the month
    const bookings = await Booking.find({
      courtId,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ date: 1, startTime: 1 });

    // Generate calendar data
    const calendar = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()];
      const workingHours = calendarConfig.getWorkingHoursForDay(dayName);
      const isBlocked = calendarConfig.isDateBlocked(currentDate);
      const isPast = currentDate < new Date().setHours(0, 0, 0, 0);

      // Get bookings for this date
      const dayBookings = bookings.filter(booking => 
        booking.date.toISOString().split('T')[0] === dateStr
      );

      // Generate available slots
      let availableSlots = [];
      if (workingHours && workingHours.isOpen && !isBlocked && !isPast) {
        availableSlots = await Booking.getAvailableSlots(courtId, currentDate, workingHours);
      }

      calendar.push({
        date: dateStr,
        dayName,
        isOpen: workingHours?.isOpen || false,
        isBlocked,
        isPast,
        workingHours: workingHours || null,
        bookings: dayBookings.map(booking => ({
          _id: booking._id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          userDetails: booking.userDetails,
          teamSize: booking.teamSize
        })),
        availableSlots,
        totalSlots: availableSlots.length,
        bookedSlots: dayBookings.length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      court: {
        _id: court._id,
        name: court.name,
        type: court.type,
        location: court.location,
        maxPlayersPerTeam: court.maxPlayersPerTeam
      },
      calendarConfig: {
        workingHours: calendarConfig.workingHours,
        pricing: calendarConfig.pricing,
        slotDuration: calendarConfig.slotDuration,
        minBookingDuration: calendarConfig.minBookingDuration,
        maxBookingDuration: calendarConfig.maxBookingDuration,
        advanceBookingDays: calendarConfig.advanceBookingDays,
        cancellationPolicy: calendarConfig.cancellationPolicy
      },
      calendar,
      month: targetMonth + 1,
      year: targetYear
    });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar',
      error: error.message
    });
  }
});

// @route   GET /api/calendar/:courtId/available-slots
// @desc    Get available time slots for a specific date
// @access  Public
router.get('/:courtId/available-slots', async (req, res) => {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot get slots for past dates'
      });
    }

    // Get calendar configuration
    const calendarConfig = await CalendarConfig.findOne({ courtId });
    if (!calendarConfig) {
      return res.status(404).json({
        success: false,
        message: 'Calendar configuration not found'
      });
    }

    // Check if date is blocked
    if (calendarConfig.isDateBlocked(targetDate)) {
      return res.json({
        success: true,
        availableSlots: [],
        message: 'This date is not available for booking'
      });
    }

    // Get working hours for the day
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getDay()];
    const workingHours = calendarConfig.getWorkingHoursForDay(dayName);

    if (!workingHours || !workingHours.isOpen) {
      return res.json({
        success: true,
        availableSlots: [],
        message: 'Court is closed on this day'
      });
    }

    // Get available slots
    const availableSlots = await Booking.getAvailableSlots(courtId, targetDate, workingHours);

    // Calculate price for each slot (assuming 1-hour duration for display)
    const slotsWithPricing = availableSlots.map(slot => {
      const endTime = moment(slot, 'HH:mm').add(1, 'hour').format('HH:mm');
      const price = calendarConfig.calculatePrice(targetDate, slot, endTime);
      
      return {
        startTime: slot,
        endTime,
        price: price,
        pricePerHour: calendarConfig.pricing.basePrice
      };
    });

    res.json({
      success: true,
      date: date,
      dayName,
      workingHours,
      availableSlots: slotsWithPricing,
      slotDuration: calendarConfig.slotDuration,
      minBookingDuration: calendarConfig.minBookingDuration,
      maxBookingDuration: calendarConfig.maxBookingDuration
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available slots',
      error: error.message
    });
  }
});

// @route   POST /api/calendar/:courtId/config
// @desc    Create or update calendar configuration for a court
// @access  Private (Company Manager)
router.post('/:courtId/config', verifyToken, verifyUser, async (req, res) => {
  try {
    const { courtId } = req.params;
    const {
      workingHours,
      pricing,
      slotDuration,
      minBookingDuration,
      maxBookingDuration,
      advanceBookingDays,
      cancellationPolicy,
      autoConfirmBookings,
      blockedDates
    } = req.body;

    // Get court details to verify company ownership
    const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
    if (!courtResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    const court = courtResponse.data.court;
    const companyId = court.companyId;

    // Verify company ownership
    const token = req.header('Authorization');
    const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${companyId}`, {
      headers: { Authorization: token }
    });

    if (!companyResponse.data.success || companyResponse.data.company.managerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not a company manager.'
      });
    }

    const company = companyResponse.data.company;

    // Find existing config or create new one
    let calendarConfig = await CalendarConfig.findOne({ courtId });
    
    if (calendarConfig) {
      // Update existing config
      if (workingHours) calendarConfig.workingHours = workingHours;
      if (pricing) calendarConfig.pricing = pricing;
      if (slotDuration) calendarConfig.slotDuration = slotDuration;
      if (minBookingDuration) calendarConfig.minBookingDuration = minBookingDuration;
      if (maxBookingDuration) calendarConfig.maxBookingDuration = maxBookingDuration;
      if (advanceBookingDays) calendarConfig.advanceBookingDays = advanceBookingDays;
      if (cancellationPolicy) calendarConfig.cancellationPolicy = cancellationPolicy;
      if (autoConfirmBookings !== undefined) calendarConfig.autoConfirmBookings = autoConfirmBookings;
      if (blockedDates) calendarConfig.blockedDates = blockedDates;
    } else {
      // Create new config
      calendarConfig = new CalendarConfig({
        courtId,
        companyId,
        workingHours,
        pricing,
        slotDuration,
        minBookingDuration,
        maxBookingDuration,
        advanceBookingDays,
        cancellationPolicy,
        autoConfirmBookings,
        blockedDates,
        courtDetails: {
          name: court.name,
          type: court.type,
          maxPlayersPerTeam: court.maxPlayersPerTeam
        },
        companyDetails: {
          companyName: company.companyName,
          managerEmail: company.managerEmail
        }
      });
    }

    await calendarConfig.save();

    res.json({
      success: true,
      message: 'Calendar configuration updated successfully',
      calendarConfig
    });
  } catch (error) {
    console.error('Update calendar config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update calendar configuration',
      error: error.message
    });
  }
});

// @route   GET /api/calendar/:courtId/config
// @desc    Get calendar configuration for a court
// @access  Private (Company Manager)
router.get('/:courtId/config', verifyToken, verifyUser, async (req, res) => {
  try {
    const { courtId } = req.params;

    // Get court details to verify company ownership
    const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
    if (!courtResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    const court = courtResponse.data.court;
    const companyId = court.companyId;

    // Verify company ownership
    const token = req.header('Authorization');
    const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${companyId}`, {
      headers: { Authorization: token }
    });

    if (!companyResponse.data.success || companyResponse.data.company.managerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not a company manager.'
      });
    }

    const calendarConfig = await CalendarConfig.findOne({ courtId });
    
    if (!calendarConfig) {
      return res.status(404).json({
        success: false,
        message: 'Calendar configuration not found'
      });
    }

    res.json({
      success: true,
      calendarConfig
    });
  } catch (error) {
    console.error('Get calendar config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar configuration',
      error: error.message
    });
  }
});

// @route   GET /api/calendar/company/:companyId/bookings
// @desc    Get all bookings for company courts with calendar view
// @access  Private (Company Manager)
router.get('/company/:companyId/bookings', verifyToken, verifyUser, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { month, year, courtId } = req.query;

    // Verify company ownership
    const token = req.header('Authorization');
    const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${companyId}`, {
      headers: { Authorization: token }
    });

    if (!companyResponse.data.success || companyResponse.data.company.managerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not a company manager.'
      });
    }

    // Calculate month range
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    // Build query
    const query = {
      companyId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (courtId) {
      query.courtId = courtId;
    }

    // Get bookings
    const bookings = await Booking.find(query)
      .sort({ date: 1, startTime: 1 });

    // Group bookings by date
    const bookingsByDate = {};
    bookings.forEach(booking => {
      const dateStr = booking.date.toISOString().split('T')[0];
      if (!bookingsByDate[dateStr]) {
        bookingsByDate[dateStr] = [];
      }
      bookingsByDate[dateStr].push(booking);
    });

    // Get company courts for summary
    const courtsResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/company/${companyId}`, {
      headers: { Authorization: token }
    });

    const courts = courtsResponse.data.success ? courtsResponse.data.courts : [];

    res.json({
      success: true,
      bookingsByDate,
      totalBookings: bookings.length,
      courts,
      month: targetMonth + 1,
      year: targetYear,
      summary: {
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        totalRevenue: bookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + b.totalPrice, 0)
      }
    });
  } catch (error) {
    console.error('Get company calendar bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company calendar bookings',
      error: error.message
    });
  }
});

// @route   GET /api/calendar/:courtId/schedule
// @desc    Get court schedule configuration for managers
// @access  Private (Company Manager)
router.get('/:courtId/schedule', verifyToken, verifyUser, async (req, res) => {
  try {
    const { courtId } = req.params;

    // Get court details
    const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
    const court = courtResponse.data;
    
    if (!court || !court._id) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    // Verify user is the company manager
    const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${court.companyId}`);
    const company = companyResponse.data;

    if (!company || company.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only court managers can access this.'
      });
    }

    // Get calendar configuration
    let calendarConfig = await CalendarConfig.findOne({ courtId });
    
    if (!calendarConfig) {
      // Create default config if none exists
      calendarConfig = new CalendarConfig({
        courtId,
        companyId: court.companyId,
        courtDetails: {
          name: court.name,
          type: court.type,
          maxPlayersPerTeam: court.maxPlayersPerTeam
        },
        companyDetails: {
          companyName: company.companyName,
          managerEmail: company.managerEmail
        }
      });
      await calendarConfig.save();
    }

    res.json({
      success: true,
      data: {
        court: {
          _id: court._id,
          name: court.name,
          type: court.type,
          location: court.location
        },
        schedule: {
          workingHours: calendarConfig.workingHours,
          pricing: calendarConfig.pricing,
          slotDuration: calendarConfig.slotDuration,
          minBookingDuration: calendarConfig.minBookingDuration,
          maxBookingDuration: calendarConfig.maxBookingDuration,
          advanceBookingDays: calendarConfig.advanceBookingDays,
          cancellationPolicy: calendarConfig.cancellationPolicy,
          autoConfirmBookings: calendarConfig.autoConfirmBookings,
          blockedDates: calendarConfig.blockedDates
        }
      }
    });

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get court schedule',
      error: error.message
    });
  }
});

// @route   PUT /api/calendar/:courtId/schedule
// @desc    Update court schedule configuration
// @access  Private (Company Manager)
router.put('/:courtId/schedule', verifyToken, verifyUser, async (req, res) => {
  try {
    const { courtId } = req.params;
    const updateData = req.body;

    // Get court details
    const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
    const court = courtResponse.data;
    
    if (!court || !court._id) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    // Verify user is the company manager
    const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${court.companyId}`);
    const company = companyResponse.data;

    if (!company || company.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only court managers can update this.'
      });
    }

    // Find and update calendar config
    let calendarConfig = await CalendarConfig.findOne({ courtId });
    
    if (!calendarConfig) {
      return res.status(404).json({
        success: false,
        message: 'Calendar configuration not found'
      });
    }

    // Update the configuration
    if (updateData.workingHours) {
      calendarConfig.workingHours = updateData.workingHours;
    }
    if (updateData.pricing) {
      calendarConfig.pricing = updateData.pricing;
    }
    if (updateData.slotDuration) {
      calendarConfig.slotDuration = updateData.slotDuration;
    }
    if (updateData.minBookingDuration) {
      calendarConfig.minBookingDuration = updateData.minBookingDuration;
    }
    if (updateData.maxBookingDuration) {
      calendarConfig.maxBookingDuration = updateData.maxBookingDuration;
    }
    if (updateData.advanceBookingDays) {
      calendarConfig.advanceBookingDays = updateData.advanceBookingDays;
    }
    if (updateData.cancellationPolicy) {
      calendarConfig.cancellationPolicy = updateData.cancellationPolicy;
    }
    if (updateData.autoConfirmBookings !== undefined) {
      calendarConfig.autoConfirmBookings = updateData.autoConfirmBookings;
    }
    if (updateData.blockedDates) {
      calendarConfig.blockedDates = updateData.blockedDates;
    }

    calendarConfig.updatedAt = new Date();
    await calendarConfig.save();

    res.json({
      success: true,
      message: 'Court schedule updated successfully',
      data: {
        schedule: {
          workingHours: calendarConfig.workingHours,
          pricing: calendarConfig.pricing,
          slotDuration: calendarConfig.slotDuration,
          minBookingDuration: calendarConfig.minBookingDuration,
          maxBookingDuration: calendarConfig.maxBookingDuration,
          advanceBookingDays: calendarConfig.advanceBookingDays,
          cancellationPolicy: calendarConfig.cancellationPolicy,
          autoConfirmBookings: calendarConfig.autoConfirmBookings,
          blockedDates: calendarConfig.blockedDates
        }
      }
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update court schedule',
      error: error.message
    });
  }
});

// Debug route for testing calendar config creation
router.get('/debug/:courtId', async (req, res) => {
  try {
    const { courtId } = req.params;
    
    // Get court details
    const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
    const court = courtResponse.data;
    
    if (!court || !court._id) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    // Delete any existing config
    const deleteResult = await CalendarConfig.deleteOne({ courtId });
    console.log('Deleted existing configs:', deleteResult);

    // Get company details
    const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${court.companyId}`);
    
    // Log what we're trying to create
    const testConfig = {
      courtId,
      companyId: court.companyId,
      courtDetails: {
        name: court.name,
        type: court.type,
        maxPlayersPerTeam: court.maxPlayersPerTeam
      },
      companyDetails: {
        companyName: companyResponse.data.companyName,
        managerEmail: companyResponse.data.managerEmail
      }
    };

    console.log('Creating config with:', JSON.stringify(testConfig, null, 2));

    // Try to create and save manually
    const calendarConfig = new CalendarConfig(testConfig);
    console.log('Created instance, about to save...');
    
    await calendarConfig.save();
    console.log('Saved successfully!');

    res.json({
      success: true,
      message: 'Debug test successful',
      config: testConfig
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
