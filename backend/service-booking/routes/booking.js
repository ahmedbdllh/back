const express = require('express');
const router = express.Router();
const moment = require('moment');
const axios = require('axios');
const Booking = require('../models/Booking');
const CalendarConfig = require('../models/CalendarConfig');
const { verifyToken, verifyUser, validateBookingAccess } = require('../middleware/auth');
const { sendManagerNotification } = require('../services/emailService');

// Service URLs
const COURT_SERVICE_URL = process.env.COURT_SERVICE_URL || 'http://localhost:5003';
const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://localhost:5001';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';
const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL || 'http://localhost:5004';
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:5002';

// TEST ROUTE - NO AUTH REQUIRED (TEMPORARY)
router.get('/test-slots/:courtId', async (req, res) => {
  res.json({
    success: true,
    message: 'Test route working',
    courtId: req.params.courtId,
    date: req.query.date,
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/bookings/available-slots/:courtId
// @desc    Get available time slots for a court on a specific date
// @access  Public (temporarily disabled auth for debugging)
router.get('/available-slots/:courtId', async (req, res) => {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Get court details
    const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
    if (!courtResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    const court = courtResponse.data.court;
    const matchDuration = court.matchTime || 60; // Default 60 minutes

    // Get calendar configuration
    let calendarConfig = await CalendarConfig.findOne({ courtId });
    if (!calendarConfig) {
      return res.status(404).json({
        success: false,
        message: 'Calendar configuration not found'
      });
    }

    // Get working hours for the date
    const selectedDate = moment(date);
    const dayOfWeek = selectedDate.format('dddd').toLowerCase();
    const workingHours = calendarConfig.getWorkingHoursForDay(dayOfWeek);

    if (!workingHours || !workingHours.isOpen) {
      return res.json({
        success: true,
        availableSlots: [],
        message: 'Court is closed on this day'
      });
    }

    // Get only available slots (booked slots are filtered out)
    const availableSlots = await Booking.getAvailableSlots(courtId, new Date(date), workingHours, matchDuration);
    
    // Calculate pricing
    const pricePerHour = calendarConfig.pricing.basePrice || 50;
    const totalPrice = calendarConfig.calculatePrice(new Date(date), '00:00', '01:00'); // Base calculation

    // Format slots with pricing
    const slotsWithPricing = availableSlots.map(slot => {
      const startMoment = moment(slot, 'HH:mm');
      const endMoment = startMoment.clone().add(matchDuration, 'minutes');
      const endTime = endMoment.format('HH:mm');
      
      return {
        time: slot,
        startTime: slot,
        endTime: endTime,
        duration: matchDuration,
        durationLabel: `${matchDuration}min`,
        price: totalPrice,
        priceLabel: `${totalPrice} DT`
      };
    });

    res.json({
      success: true,
      availableSlots: slotsWithPricing,
      court: {
        name: court.name,
        type: court.type,
        matchTime: court.matchTime || matchDuration
      },
      date,
      workingHours,
      matchDuration,
      message: `Found ${slotsWithPricing.length} available time slots (booked slots are hidden)`
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available slots',
      error: error.message
    });
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings for user
// @access  Private
router.get('/', verifyToken, verifyUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, courtId, date } = req.query;
    const query = { userId: req.user.userId };

    if (status) query.status = status;
    if (courtId) query.courtId = courtId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(query)
      .sort({ date: -1, startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

// @route   GET /api/bookings/company/:companyId
// @desc    Get all bookings for a company
// @access  Private (Company Manager)
router.get('/company/:companyId', verifyToken, verifyUser, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20, status, courtId, date } = req.query;
    
    // Verify company access
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

    const query = { companyId };
    if (status) query.status = status;
    if (courtId) query.courtId = courtId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(query)
      .sort({ date: -1, startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get company bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company bookings',
      error: error.message
    });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', verifyToken, verifyUser, async (req, res) => {
  try {
    const {
      courtId,
      date,
      startTime,
      teamSize,
      players = [],
      notes
    } = req.body;

    // Validate required fields
    if (!courtId || !date || !startTime || !teamSize) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get court details
    const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
    if (!courtResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    const court = courtResponse.data.court;
    const companyId = court.companyId;
    
    // Use court's predefined match duration - players cannot modify this
    const matchDuration = court.matchTime; // This is set by the manager
    
    // Calculate end time based on court's match duration
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = startTotalMinutes + matchDuration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMin = endTotalMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    // Get company details
    const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${companyId}`);
    if (!companyResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const company = companyResponse.data.company;

    // Get manager/owner details from auth service using ownerId
    let managerEmail = null;
    let managerName = null;
    let managerPhone = null;
    
    if (company.ownerId) {
      try {
        console.log('🔍 Fetching manager details for ownerId:', company.ownerId);
        
        // Use the correct endpoint and headers based on the auth service
        const managerResponse = await axios.get(`${AUTH_SERVICE_URL}/api/auth/user/${company.ownerId}`, {
          headers: { 
            'x-auth-token': req.header('Authorization')?.replace('Bearer ', '') // Convert Bearer token to x-auth-token
          }
        });
        
        console.log('👤 Manager response:', managerResponse.status, JSON.stringify(managerResponse.data, null, 2));
        
        if (managerResponse.data.success && managerResponse.data.user) {
          const manager = managerResponse.data.user;
          managerEmail = manager.email;
          managerName = manager.fullName || manager.companyName;
          managerPhone = manager.phoneNumber;
          console.log('✅ Manager details found:', { 
            email: managerEmail, 
            name: managerName, 
            phone: managerPhone,
            role: manager.role
          });
        } else {
          console.log('❌ Manager data not found in response:', managerResponse.data);
        }
      } catch (managerError) {
        console.error('⚠️ Could not fetch manager details:', managerError.message);
        console.error('⚠️ Error details:', {
          status: managerError.response?.status,
          statusText: managerError.response?.statusText,
          data: managerError.response?.data
        });
        console.log('⚠️ Will proceed without manager email - booking will still be created');
      }
    } else {
      console.log('⚠️ No ownerId found in company data');
    }

    // Get calendar configuration
    let calendarConfig = await CalendarConfig.findOne({ courtId });
    if (!calendarConfig) {
      // Create default calendar config if not exists
      calendarConfig = new CalendarConfig({
        courtId,
        companyId,
        courtDetails: {
          name: court.name,
          type: court.type,
          maxPlayersPerTeam: court.maxPlayersPerTeam
        },
        companyDetails: {
          companyName: company.companyName,
          managerEmail: managerEmail
        }
      });
      await calendarConfig.save();
    }

    // Validate booking date
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates'
      });
    }

    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + calendarConfig.advanceBookingDays);
    
    if (bookingDate > maxAdvanceDate) {
      return res.status(400).json({
        success: false,
        message: `Cannot book more than ${calendarConfig.advanceBookingDays} days in advance`
      });
    }

    // Check if date is blocked
    if (calendarConfig.isDateBlocked(bookingDate)) {
      return res.status(400).json({
        success: false,
        message: 'This date is not available for booking'
      });
    }

    // Validate working hours
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bookingDate.getDay()];
    const workingHours = calendarConfig.getWorkingHoursForDay(dayName);
    
    if (!workingHours || !workingHours.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'Court is closed on this day'
      });
    }

    if (startTime < workingHours.start || endTime > workingHours.end) {
      return res.status(400).json({
        success: false,
        message: `Court is only open from ${workingHours.start} to ${workingHours.end}`
      });
    }

    // Calculate duration - use court's predefined match duration
    const duration = matchDuration; // Set by manager, not modifiable by players

    // Validate that the booking doesn't exceed court working hours
    if (endHour >= 24 || (endHour === 23 && endMin > 30)) {
      return res.status(400).json({
        success: false,
        message: 'Booking would extend beyond valid hours (23:30)'
      });
    }

    // Check for conflicts with proper date range search and overlap detection
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`🔍 Checking individual booking conflicts for court ${courtId} on ${bookingDate.toDateString()}`);
    console.log(`🕐 Requested time slot: ${startTime} - ${endTime}`);

    const existingBookings = await Booking.find({
      courtId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'confirmed'
    }).sort({ startTime: 1 });

    console.log(`📋 Found ${existingBookings.length} existing bookings for this date:`, 
      existingBookings.map(b => ({ 
        date: b.date, 
        startTime: b.startTime, 
        endTime: b.endTime, 
        status: b.status 
      }))
    );

    // Check for time conflicts using the same logic as getAvailableSlots
    const [requestedStartHour, requestedStartMin] = startTime.split(':').map(Number);
    const [requestedEndHour, requestedEndMin] = endTime.split(':').map(Number);
    const requestedStartMinutes = requestedStartHour * 60 + requestedStartMin;
    const requestedEndMinutes = requestedEndHour * 60 + requestedEndMin;

    const conflictingBooking = existingBookings.find(booking => {
      const [bookingStartHour, bookingStartMin] = booking.startTime.split(':').map(Number);
      const [bookingEndHour, bookingEndMin] = booking.endTime.split(':').map(Number);
      const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin;
      const bookingEndMinutes = bookingEndHour * 60 + bookingEndMin;
      
      // Check for overlap: requested slot conflicts with existing booking if they overlap
      const hasOverlap = (requestedStartMinutes < bookingEndMinutes && requestedEndMinutes > bookingStartMinutes);
      
      if (hasOverlap) {
        console.log(`❌ Individual booking conflict detected: ${startTime}-${endTime} overlaps with existing booking ${booking.startTime}-${booking.endTime}`);
      }
      
      return hasOverlap;
    });

    if (conflictingBooking) {
      console.log(`🚫 Individual booking rejected due to conflict with booking at ${conflictingBooking.startTime}-${conflictingBooking.endTime}`);
      return res.status(409).json({
        success: false,
        message: 'This time slot has just been booked by another user. Please refresh and select a different time.'
      });
    }

    console.log(`✅ No conflicts found - individual booking can proceed for ${startTime}-${endTime}`);

    // Calculate price
    const pricePerHour = calendarConfig.pricing.basePrice;
    const totalPrice = calendarConfig.calculatePrice(bookingDate, startTime, endTime);

    // Create booking
    const booking = new Booking({
      courtId,
      companyId,
      userId: req.user.userId,
      date: bookingDate,
      startTime,
      endTime,
      duration,
      teamSize,
      players,
      totalPrice,
      pricePerHour,
      notes,
      status: 'confirmed', // Always confirmed, no pending approval needed
      courtDetails: {
        name: court.name,
        type: court.type,
        address: court.location?.address,
        city: court.location?.city
      },
      companyDetails: {
        companyName: company.companyName,
        managerName: managerName,
        managerEmail: managerEmail,
        managerPhone: managerPhone
      },
      userDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      }
    });

    await booking.save();

    // Send notification email to court manager
    if (managerEmail) {
      try {
        const managerEmailDetails = {
          courtName: court.name,
          companyName: company.companyName,
          teamName: null, // Individual booking, no team
          playerName: req.user.name || req.user.fullName,
          playerEmail: req.user.email,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          totalPrice: booking.totalPrice,
          bookingId: booking._id,
          teamSize: teamSize
        };

        console.log('📧 Sending manager notification email to:', managerEmail);
        await sendManagerNotification(managerEmail, managerEmailDetails);
        console.log('✅ Manager notification email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send manager notification email:', emailError.message);
        // Don't fail the booking if email fails - just log the error
      }
    } else {
      console.log('⚠️ No manager email found - skipping manager notification');
      console.log('📝 Company details:', {
        companyName: company.companyName,
        ownerId: company.ownerId,
        ownerRole: company.ownerRole
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

// @route   PUT /api/bookings/:bookingId/status
// @desc    Update booking status (for company managers)
// @access  Private
router.put('/:bookingId/status', verifyToken, verifyUser, validateBookingAccess, async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const booking = req.booking;

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: confirmed, cancelled, completed'
      });
    }

    if (status === 'cancelled' && !cancellationReason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    booking.status = status;
    if (cancellationReason) {
      booking.cancellationReason = cancellationReason;
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
});

// @route   DELETE /api/bookings/:bookingId
// @desc    Cancel/Delete booking (must be at least 12 hours before booking time)
// @access  Private
router.delete('/:bookingId', verifyToken, verifyUser, validateBookingAccess, async (req, res) => {
  try {
    const booking = req.booking;
    const { reason } = req.body;

    // Enforce 12-hour cancellation policy
    const bookingDateTime = new Date(`${booking.date.toDateString()} ${booking.startTime}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

    if (hoursUntilBooking < 12) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation must be done at least 12 hours before the booking time'
      });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

// @route   GET /api/bookings/:bookingId
// @desc    Get booking details
// @access  Private
router.get('/:bookingId', verifyToken, verifyUser, validateBookingAccess, async (req, res) => {
  try {
    res.json({
      success: true,
      booking: req.booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
});

// @route   POST /api/bookings/team_booking
// @desc    Create a new team booking
// @access  Private
router.post('/team_booking', verifyToken, verifyUser, async (req, res) => {
  try {
    const {
      courtId,
      date,
      startTime,
      teamId,
      notes
    } = req.body;

    // Validate required fields
    if (!courtId || !date || !startTime || !teamId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get court details
    const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
    if (!courtResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    const court = courtResponse.data.court;
    const companyId = court.companyId;
    
    // Use court's predefined match duration
    const matchDuration = court.matchTime;
    
    // Calculate end time based on court's match duration
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = startTotalMinutes + matchDuration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMin = endTotalMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    // Get team details
    console.log('🏆 Fetching team details for teamId:', teamId);
    const teamResponse = await axios.get(`${TEAM_SERVICE_URL}/api/teams/${teamId}`, {
      headers: { Authorization: req.header('Authorization') }
    });

    if (!teamResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const team = teamResponse.data.team;
    console.log('🏆 Team found:', team.name, 'with', team.players?.length || 0, 'players');

    // Get company details
    let companyDetails;
    let managerEmail = '';
    let managerName = '';
    let managerPhone = '';

    try {
      console.log('🏢 Fetching company details for companyId:', companyId);
      const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${companyId}`);
      
      if (!companyResponse.data.success) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
      companyDetails = companyResponse.data;
      
      // Get manager/owner details from auth service using ownerId
      if (companyDetails.ownerId) {
        try {
          console.log('🔍 Fetching manager details for ownerId:', companyDetails.ownerId);
          
          const managerResponse = await axios.get(`${AUTH_SERVICE_URL}/api/auth/user/${companyDetails.ownerId}`, {
            headers: { 
              'x-auth-token': req.header('Authorization')?.replace('Bearer ', '')
            }
          });
          
          console.log('👤 Manager response:', managerResponse.status, JSON.stringify(managerResponse.data, null, 2));
          
          if (managerResponse.data.success && managerResponse.data.user) {
            const manager = managerResponse.data.user;
            managerEmail = manager.email;
            managerName = manager.fullName || manager.companyName;
            managerPhone = manager.phoneNumber;
            console.log('✅ Team booking - Manager details found:', { 
              email: managerEmail, 
              name: managerName, 
              phone: managerPhone 
            });
          }
        } catch (managerError) {
          console.error('⚠️ Could not fetch manager details for team booking:', managerError.message);
        }
      }
    } catch (error) {
      console.error('Company fetch error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch company details',
        error: error.message
      });
    }

    // Get calendar configuration
    let calendarConfig = await CalendarConfig.findOne({ courtId });
    if (!calendarConfig) {
      calendarConfig = new CalendarConfig({
        courtId,
        companyId,
        courtDetails: {
          name: court.name,
          type: court.type,
          maxPlayersPerTeam: court.maxPlayersPerTeam
        },
        companyDetails: {
          companyName: companyDetails.companyName,
          managerEmail: managerEmail
        }
      });
      await calendarConfig.save();
    }

    // Validate booking date
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates'
      });
    }

    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + calendarConfig.advanceBookingDays);
    
    if (bookingDate > maxAdvanceDate) {
      return res.status(400).json({
        success: false,
        message: `Cannot book more than ${calendarConfig.advanceBookingDays} days in advance`
      });
    }

    // Check for existing booking conflicts with proper date range search
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`🔍 Checking team booking conflicts for court ${courtId} on ${bookingDate.toDateString()}`);
    console.log(`🕐 Requested time slot: ${startTime} - ${endTime}`);

    const existingBookings = await Booking.find({
      courtId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'confirmed'
    }).sort({ startTime: 1 });

    console.log(`📋 Found ${existingBookings.length} existing bookings for this date:`, 
      existingBookings.map(b => ({ 
        date: b.date, 
        startTime: b.startTime, 
        endTime: b.endTime, 
        status: b.status 
      }))
    );

    // Check for time conflicts using the same logic as getAvailableSlots
    const [requestedStartHour, requestedStartMin] = startTime.split(':').map(Number);
    const [requestedEndHour, requestedEndMin] = endTime.split(':').map(Number);
    const requestedStartMinutes = requestedStartHour * 60 + requestedStartMin;
    const requestedEndMinutes = requestedEndHour * 60 + requestedEndMin;

    const conflictingBooking = existingBookings.find(booking => {
      const [bookingStartHour, bookingStartMin] = booking.startTime.split(':').map(Number);
      const [bookingEndHour, bookingEndMin] = booking.endTime.split(':').map(Number);
      const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin;
      const bookingEndMinutes = bookingEndHour * 60 + bookingEndMin;
      
      // Check for overlap: requested slot conflicts with existing booking if they overlap
      const hasOverlap = (requestedStartMinutes < bookingEndMinutes && requestedEndMinutes > bookingStartMinutes);
      
      if (hasOverlap) {
        console.log(`❌ Team booking conflict detected: ${startTime}-${endTime} overlaps with existing booking ${booking.startTime}-${booking.endTime}`);
      }
      
      return hasOverlap;
    });

    if (conflictingBooking) {
      console.log(`🚫 Team booking rejected due to conflict with booking at ${conflictingBooking.startTime}-${conflictingBooking.endTime}`);
      return res.status(409).json({
        success: false,
        message: 'This time slot has just been booked by another user. Please refresh and select a different time.'
      });
    }

    console.log(`✅ No conflicts found - team booking can proceed for ${startTime}-${endTime}`);

    // Create team booking
    const booking = new Booking({
      userId: req.user.userId,
      courtId,
      companyId,
      date: bookingDate,
      startTime,
      endTime,
      matchDuration,
      teamSize: team.players?.length || 0,
      players: team.players || [],
      teamId: team._id,
      teamName: team.name,
      notes,
      status: 'confirmed'
    });

    const savedBooking = await booking.save();

    // Send confirmation email to user
    try {
      console.log('📧 Sending booking confirmation email to user...');
      const userEmailData = {
        to: req.user.email,
        type: 'booking_confirmation_team',
        data: {
          userName: req.user.fullName,
          courtName: court.name,
          date: bookingDate.toLocaleDateString(),
          time: `${startTime} - ${endTime}`,
          teamName: team.name,
          playerCount: team.players?.length || 0,
          bookingId: savedBooking._id
        }
      };

      await axios.post(`${EMAIL_SERVICE_URL}/api/email/send`, userEmailData);
      console.log('✅ User confirmation email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send user confirmation email:', emailError.message);
    }

    // Send notification email to manager
    if (managerEmail) {
      try {
        console.log('📧 Sending manager notification email to:', managerEmail);
        const managerEmailData = {
          to: managerEmail,
          type: 'manager_booking_notification_team',
          data: {
            managerName: managerName,
            courtName: court.name,
            date: bookingDate.toLocaleDateString(),
            time: `${startTime} - ${endTime}`,
            teamName: team.name,
            playerCount: team.players?.length || 0,
            userEmail: req.user.email,
            bookingId: savedBooking._id
          }
        };

        await axios.post(`${EMAIL_SERVICE_URL}/api/email/send`, managerEmailData);
        console.log('✅ Manager notification email sent successfully');
      } catch (emailError) {
        console.error('⚠️ Failed to send manager notification email:', emailError.message);
      }
    } else {
      console.log('📧 Sending manager notification email to: undefined');
      console.log('⚠️ No manager email available - skipping manager notification');
    }

    res.status(201).json({
      success: true,
      message: 'Team booking created successfully',
      booking: {
        id: savedBooking._id,
        courtId: savedBooking.courtId,
        courtName: court.name,
        date: savedBooking.date,
        startTime: savedBooking.startTime,
        endTime: savedBooking.endTime,
        teamName: savedBooking.teamName,
        playerCount: savedBooking.teamSize,
        status: savedBooking.status
      }
    });

  } catch (error) {
    console.error('Team booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team booking',
      error: error.message
    });
  }
});

module.exports = router;
