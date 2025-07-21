const express = require('express');
const router = express.Router();
const moment = require('moment');
const axios = require('axios');
const Booking = require('../models/Booking');
const CalendarConfig = require('../models/CalendarConfig');
const { verifyToken, verifyUser } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../services/emailService');

// Service URLs
const COURT_SERVICE_URL = process.env.COURT_SERVICE_URL || 'http://localhost:5003';
const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://localhost:5001';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';
const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL || 'http://localhost:5004';

// @route   POST /api/team-bookings
// @desc    Create a new team booking (only team captains can book)
// @access  Private
router.post('/', verifyToken, verifyUser, async (req, res) => {
  try {
    const {
      courtId,
      teamId,
      date,
      startTime,
      notes
    } = req.body;

    console.log('🔍 Booking request debugging:');
    console.log('  - req.body:', JSON.stringify(req.body, null, 2));
    console.log('  - courtId:', courtId);
    console.log('  - teamId:', teamId);
    console.log('  - date:', date);
    console.log('  - startTime:', startTime);
    console.log('  - req.user:', JSON.stringify(req.user, null, 2));
    console.log('  - teamId:', teamId);
    console.log('  - date:', date);
    console.log('  - startTime:', startTime);

    // Validate required fields - duration is no longer required as it comes from court config
    if (!courtId || !teamId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: courtId, teamId, date, startTime'
      });
    }

    // Verify that the user is the captain of the team
    try {
      const teamResponse = await axios.get(`${TEAM_SERVICE_URL}/api/teams/${teamId}`, {
        headers: { Authorization: req.header('Authorization') }
      });

      // Team service returns team object directly, not wrapped in success structure
      if (!teamResponse.data || teamResponse.data.error) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      const team = teamResponse.data;
      
      console.log('🔍 Team response debugging:');
      console.log('  - teamResponse.status:', teamResponse.status);
      console.log('  - teamResponse.data:', JSON.stringify(teamResponse.data, null, 2));
      console.log('  - team object:', team);
      console.log('  - team.captain:', team ? team.captain : 'team is undefined');
      console.log('  - typeof team.captain:', team ? typeof team.captain : 'N/A');
      
      console.log('🔍 User debugging:');
      console.log('  - req.user:', JSON.stringify(req.user, null, 2));
      console.log('  - req.user.userId:', req.user ? req.user.userId : 'req.user is undefined');
      console.log('  - typeof req.user.userId:', req.user ? typeof req.user.userId : 'N/A');
      
      // Check if the current user is the team captain
      if (!team || !team.captain) {
        return res.status(404).json({
          success: false,
          message: 'Team or captain information not found'
        });
      }
      
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          message: 'User information not found in request'
        });
      }
      
      if (team.captain.toString() !== req.user.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only team captains can make team bookings'
        });
      }

    } catch (error) {
      console.error('Team verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify team membership'
      });
    }

    // Get court details
    let courtDetails;
    try {
      console.log('🏟️ Fetching court details for ID:', courtId);
      const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
      console.log('🏟️ Court response status:', courtResponse.status);
      console.log('🏟️ Court response data:', JSON.stringify(courtResponse.data, null, 2));
      
      // Court service returns court object directly, not wrapped in success structure
      if (!courtResponse.data || courtResponse.data.error) {
        console.log('❌ Court not found or error in response');
        return res.status(404).json({
          success: false,
          message: 'Court not found'
        });
      }
      courtDetails = courtResponse.data;
    } catch (error) {
      console.error('Court verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify court'
      });
    }

    // Use court's predefined match duration - set by manager, not modifiable by players
    const duration = courtDetails.matchTime;

    // Get company details
    let companyDetails;
    try {
      const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${courtDetails.companyId}`);
      
      console.log('🏢 Company response debugging:');
      console.log('  - companyResponse.status:', companyResponse.status);
      console.log('  - companyResponse.data:', JSON.stringify(companyResponse.data, null, 2));
      
      // Company service returns company object directly, not wrapped in success structure
      if (!companyResponse.data || companyResponse.data.message) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
      companyDetails = companyResponse.data;
    } catch (error) {
      console.error('Company verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify company'
      });
    }

    // Calculate end time
    const startMoment = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const endMoment = startMoment.clone().add(duration, 'minutes');
    const endTime = endMoment.format('HH:mm');

    // Check for booking conflicts
    const existingBooking = await Booking.findOne({
      courtId: courtId,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    // Get calendar configuration for pricing
    let calendarConfig = await CalendarConfig.findOne({ courtId });
    if (!calendarConfig) {
      return res.status(404).json({
        success: false,
        message: 'Court schedule not configured'
      });
    }

    console.log('📅 Calendar config debugging:');
    console.log('  - calendarConfig:', JSON.stringify(calendarConfig, null, 2));
    console.log('  - calendarConfig.schedule:', calendarConfig.schedule);
    console.log('  - calendarConfig.pricing:', calendarConfig.pricing);

    // Calculate pricing based on calendar configuration
    // Note: pricing is directly in calendarConfig, not under schedule
    const pricePerHour = calendarConfig.pricing?.basePrice || 50;
    const durationHours = duration / 60;
    let totalPrice = pricePerHour * durationHours;

    // Check if this is an advance booking
    const bookingDate = moment(date);
    const today = moment();
    const daysInAdvance = bookingDate.diff(today, 'days');
    
    if (daysInAdvance >= (calendarConfig.advanceBookingDays || 30)) {
      // Apply advance booking pricing if configured
      // For now, keep the base price
      totalPrice = pricePerHour * durationHours;
    }

    // Get team details for caching
    const teamResponse = await axios.get(`${TEAM_SERVICE_URL}/api/teams/${teamId}`, {
      headers: { Authorization: req.header('Authorization') }
    });
    const team = teamResponse.data;

    // Get captain details
    const captainResponse = await axios.get(`${AUTH_SERVICE_URL}/api/auth/user/${team.captain}`, {
      headers: { Authorization: req.header('Authorization') }
    });
    const captain = captainResponse.data.user;

    console.log('📝 About to create booking with data:');
    console.log('  - courtDetails object:', JSON.stringify({
      name: courtDetails.name || 'Unknown Court',
      type: courtDetails.type || 'Unknown Type',
      address: courtDetails.address || '',
      city: courtDetails.city || ''
    }, null, 2));
    
    // Create the team booking
    const bookingData = {
      courtId,
      companyId: courtDetails.companyId,
      userId: req.user.userId, // Captain's user ID
      teamId,
      bookingType: 'team',
      date: new Date(date),
      startTime,
      endTime,
      duration,
      teamSize: team.members?.length || 1,
      totalPrice,
      pricePerHour,
      notes: notes || '',
      status: calendarConfig.autoConfirmBookings ? 'confirmed' : 'pending',
      // Cached details
      courtDetails: {
        name: courtDetails.name || 'Unknown Court',
        type: courtDetails.type || 'Unknown Type',
        address: courtDetails.address || '',
        city: courtDetails.city || ''
      },
      companyDetails: {
        companyName: companyDetails.companyName,
        managerName: companyDetails.managerName,
        managerEmail: companyDetails.managerEmail,
        managerPhone: companyDetails.managerPhone
      },
      userDetails: {
        name: captain.fullName,
        email: captain.email,
        phone: captain.phoneNumber
      },
      teamDetails: {
        teamName: team.name || team.teamName, // Use team.name as shown in debugging
        captainName: captain.fullName,
        captainEmail: captain.email,
        memberCount: team.members?.length || 1
      }
    };

    console.log('📝 Full booking data:', JSON.stringify(bookingData, null, 2));
    
    const booking = new Booking(bookingData);

    console.log('📝 About to save booking with data:', JSON.stringify(booking.toObject(), null, 2));

    await booking.save();

    console.log('✅ Booking saved successfully with ID:', booking._id);

    // Send confirmation email
    try {
      const emailDetails = {
        courtName: courtDetails.name,
        teamName: team.name || team.teamName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        totalPrice: booking.totalPrice,
        bookingId: booking._id,
        captainName: captain.fullName
      };

      console.log('📧 Sending confirmation email to:', captain.email);
      await sendBookingConfirmation(captain.email, emailDetails);
      console.log('✅ Confirmation email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError.message);
      // Don't fail the booking if email fails - just log the error
    }

    res.status(201).json({
      success: true,
      message: 'Team booking created successfully',
      booking: {
        id: booking._id,
        courtName: courtDetails.name,
        teamName: team.name || team.teamName, // Use team.name as shown in debugging
        date: booking.formattedDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        totalPrice: booking.totalPrice,
        status: booking.status,
        bookingType: 'team'
      }
    });

  } catch (error) {
    console.error('💥 Team booking creation error:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Request data was:', JSON.stringify(req.body, null, 2));
    res.status(500).json({
      success: false,
      message: 'Failed to create team booking',
      error: error.message
    });
  }
});

// @route   GET /api/team-bookings/team/:teamId
// @desc    Get all bookings for a specific team
// @access  Private
router.get('/team/:teamId', verifyToken, verifyUser, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { page = 1, limit = 10, status, date } = req.query;

    // Verify that the user is a member or captain of the team
    try {
      const teamResponse = await axios.get(`${TEAM_SERVICE_URL}/api/teams/${teamId}`, {
        headers: { Authorization: req.header('Authorization') }
      });

      // Team service returns team object directly, not wrapped in success structure
      if (!teamResponse.data || teamResponse.data.error) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      const team = teamResponse.data;
      const userIdString = req.user.userId ? req.user.userId.toString() : '';
      const captainIdString = team.captain ? team.captain.toString() : '';
      
      // Check if user is captain
      const isCaptain = captainIdString === userIdString;
      
      // Check if user is a member (members array contains objects with userId field)
      const isMember = team.members?.some(member => 
        member.userId && member.userId.toString() === userIdString
      );
      
      const hasAccess = isCaptain || isMember;
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this team'
        });
      }

    } catch (error) {
      console.error('Team verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify team membership'
      });
    }

    const query = { teamId, bookingType: 'team' };

    if (status) query.status = status;
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
    console.error('Get team bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team bookings',
      error: error.message
    });
  }
});

// @route   GET /api/team-bookings/available-slots/:courtId
// @desc    Get available time slots for a court on a specific date
// @access  Private
router.get('/available-slots/:courtId', verifyToken, verifyUser, async (req, res) => {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    // Get court details to get the fixed match duration
    let courtDetails;
    try {
      const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
      // Court service returns court object directly, not wrapped in success structure
      if (!courtResponse.data || courtResponse.data.error) {
        return res.status(404).json({
          success: false,
          message: 'Court not found'
        });
      }
      courtDetails = courtResponse.data;
    } catch (error) {
      console.error('Court verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify court'
      });
    }

    // Get calendar configuration
    const calendarConfig = await CalendarConfig.findOne({ courtId });
    if (!calendarConfig) {
      return res.status(404).json({
        success: false,
        message: 'Court schedule not configured'
      });
    }

    const selectedDate = moment(date);
    const dayOfWeek = selectedDate.format('dddd').toLowerCase();
    
    // Check if court is open on this day
    const workingHours = calendarConfig.workingHours[dayOfWeek];
    if (!workingHours || !workingHours.isOpen) {
      return res.json({
        success: true,
        availableSlots: [],
        message: 'Court is closed on this day'
      });
    }

    // Get available slots using the static method
    const availableSlots = await Booking.getAvailableSlots(courtId, new Date(date), workingHours);
    
    // Use court's fixed match duration (set by manager)
    const matchDuration = courtDetails.matchTime;
    const pricePerHour = calendarConfig.pricing?.basePrice || 50;
    const hours = matchDuration / 60;
    const price = pricePerHour * hours;

    // Format response with the fixed duration and pricing
    const slotsWithPricing = availableSlots.map(slot => {
      return {
        time: slot,
        duration: matchDuration,
        durationLabel: `${matchDuration}min`,
        price: price,
        priceLabel: `${price} DT`
      };
    });

    res.json({
      success: true,
      date: selectedDate.format('YYYY-MM-DD'),
      dayOfWeek: dayOfWeek,
      workingHours: workingHours,
      availableSlots: slotsWithPricing,
      matchDuration: matchDuration,
      pricePerHour,
      fixedDuration: true // Indicates that duration is fixed by manager
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

module.exports = router;
