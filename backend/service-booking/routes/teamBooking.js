const express = require('express');
const router = express.Router();
const moment = require('moment');
const axios = require('axios');
const Booking = require('../models/Booking');
const CalendarConfig = require('../models/CalendarConfig');
const { verifyToken, verifyUser } = require('../middleware/auth');
const { sendBookingConfirmation, sendManagerNotification } = require('../services/emailService');

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

    // Extract user ID at function scope level
    if (!req.user || (!req.user.userId && !req.user.id)) {
      console.log('❌ User verification failed - req.user:', req.user);
      return res.status(401).json({
        success: false,
        message: 'User information not found in request'
      });
    }
    
    const userId = req.user.userId || req.user.id;
    console.log('✅ User ID extracted:', userId);

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
      console.log('  - req.user.id:', req.user ? req.user.id : 'req.user is undefined');
      console.log('  - typeof req.user.userId:', req.user ? typeof req.user.userId : 'N/A');
      console.log('  - typeof req.user.id:', req.user ? typeof req.user.id : 'N/A');
      
      // Check if the current user is the team captain
      if (!team || !team.captain) {
        return res.status(404).json({
          success: false,
          message: 'Team or captain information not found'
        });
      }
      
      if (team.captain.toString() !== userId.toString()) {
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
    let managerEmail = null;
    let managerName = null;
    let managerPhone = null;
    
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
      status: 'confirmed', // Only check confirmed bookings since we removed pending status
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
        message: 'This time slot has just been booked by another user. Please refresh and select a different time.'
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

    // Get team details first to count members
    const teamResponse = await axios.get(`${TEAM_SERVICE_URL}/api/teams/${teamId}`, {
      headers: { Authorization: req.header('Authorization') }
    });
    const team = teamResponse.data.team || teamResponse.data;

    // Calculate pricing: Manager's set price + 15 TND per person
    const managerPrice = calendarConfig.pricing?.pricePerMatch || calendarConfig.pricing?.basePrice || 50;
    const teamSize = (team.members ? team.members.length : 0) + 1; // +1 for captain
    const totalPrice = managerPrice + (15 * teamSize);

    console.log('💰 Pricing calculation:');
    console.log('  - Manager set price:', managerPrice, 'TND');
    console.log('  - Team size (including captain):', teamSize);
    console.log('  - Price per person (15 TND):', 15);
    console.log('  - Total price:', totalPrice, 'TND');

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
      userId: userId, // Captain's user ID (extracted earlier)
      teamId,
      bookingType: 'team',
      date: new Date(date),
      startTime,
      endTime,
      duration,
      teamSize: team.members?.length || 1,
      totalPrice,
      notes: notes || '',
      status: 'confirmed', // Always confirmed, no pending approval needed
      // Cached details
      courtDetails: {
        name: courtDetails.name || 'Unknown Court',
        type: courtDetails.type || 'Unknown Type',
        address: courtDetails.address || '',
        city: courtDetails.city || ''
      },
      companyDetails: {
        companyName: companyDetails.companyName,
        managerName: managerName,
        managerEmail: managerEmail,
        managerPhone: managerPhone
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

    // Send confirmation email to team captain
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

    // Send notification email to court manager
    if (managerEmail) {
      try {
        const managerEmailDetails = {
          courtName: courtDetails.name,
          companyName: companyDetails.companyName,
          teamName: team.name || team.teamName,
          playerName: captain.fullName,
          playerEmail: captain.email,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          totalPrice: booking.totalPrice,
          bookingId: booking._id,
          teamSize: team.members?.length || 1
        };

        console.log('📧 Sending manager notification email to:', managerEmail);
        await sendManagerNotification(managerEmail, managerEmailDetails);
        console.log('✅ Manager notification email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send manager notification email:', emailError.message);
        // Don't fail the booking if email fails - just log the error
      }
    } else {
      console.log('⚠️ No manager email found - skipping manager notification for team booking');
      console.log('📝 Company details:', {
        companyName: companyDetails.companyName,
        ownerId: companyDetails.ownerId,
        ownerRole: companyDetails.ownerRole
      });
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
      const userId = req.user.userId || req.user.id;
      const userIdString = userId ? userId.toString() : '';
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
    
    // Use court's fixed match duration (set by manager)
    const matchDuration = courtDetails.matchTime;
    
    // Check if court is open on this day
    const workingHours = calendarConfig.workingHours[dayOfWeek];
    if (!workingHours || !workingHours.isOpen) {
      return res.json({
        success: true,
        availableSlots: [],
        message: 'Court is closed on this day'
      });
    }

    // Get only available slots (excluding booked ones)
    const availableSlots = await Booking.getAvailableSlots(courtId, new Date(date), workingHours, matchDuration);
    
    // Get pricing configuration
    const managerPrice = calendarConfig.pricing?.pricePerMatch || calendarConfig.pricing?.basePrice || 50;
    
    // For slots display, we need to get team info to calculate correct price
    let teamSize = 1; // Default to 1 if team not found
    try {
      if (req.query.teamId) {
        const teamResponse = await axios.get(`${TEAM_SERVICE_URL}/api/teams/${req.query.teamId}`, {
          headers: { Authorization: req.header('Authorization') }
        });
        const team = teamResponse.data.team || teamResponse.data;
        teamSize = (team.members ? team.members.length : 0) + 1; // +1 for captain
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch team for pricing calculation:', error.message);
    }
    
    const price = managerPrice + (15 * teamSize);

    console.log('💰 Available slots pricing:');
    console.log('  - Manager set price:', managerPrice, 'TND');
    console.log('  - Team size:', teamSize);
    console.log('  - Total price:', price, 'TND');

    // Format response with pricing information (only available slots)
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
        price: price,
        priceLabel: `${price} DT`
      };
    });

    res.json({
      success: true,
      date: selectedDate.format('YYYY-MM-DD'),
      dayOfWeek: dayOfWeek,
      workingHours: workingHours,
      availableSlots: slotsWithPricing, // Only truly available slots (booked slots are hidden)
      matchDuration: matchDuration,
      managerPrice: managerPrice,
      pricePerPerson: 15,
      teamSize: teamSize,
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

// @route   GET /api/team-bookings/history
// @desc    Get user's booking history
// @access  Private
router.get('/history', verifyToken, verifyUser, async (req, res) => {
  try {
    // Extract user ID
    const userId = req.user.userId || req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    console.log('📚 Fetching booking history for user:', userId);

    // Get user's teams first
    const teamsResponse = await axios.get(`${TEAM_SERVICE_URL}/api/teams/user/${userId}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });

    const userTeams = teamsResponse.data.teams || [];
    const teamIds = userTeams.map(team => team._id);

    console.log('👥 User teams:', teamIds);

    // Find all bookings for user's teams
    const bookings = await Booking.find({
      teamId: { $in: teamIds }
    }).sort({ date: -1, startTime: -1 });

    console.log('📅 Found bookings:', bookings.length);

    // Enrich bookings with court and team data
    const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
      try {
        // Get court data
        let courtData = null;
        try {
          const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${booking.courtId}`);
          courtData = courtResponse.data; // Court service returns court object directly
        } catch (courtError) {
          console.warn('⚠️ Could not fetch court data for booking:', booking._id);
        }

        // Get team data
        let teamData = null;
        try {
          const teamResponse = await axios.get(`${TEAM_SERVICE_URL}/api/teams/${booking.teamId}`);
          teamData = teamResponse.data; // Team service returns team object directly
        } catch (teamError) {
          console.warn('⚠️ Could not fetch team data for booking:', booking._id);
        }

        return {
          ...booking.toObject(),
          court: courtData,
          team: teamData
        };
      } catch (error) {
        console.error('Error enriching booking:', booking._id, error);
        return booking.toObject();
      }
    }));

    res.json({
      success: true,
      bookings: enrichedBookings
    });

  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking history',
      error: error.message
    });
  }
});

// @route   PUT /api/team-bookings/:bookingId/cancel
// @desc    Cancel a booking (must be 12+ hours before)
// @access  Private
router.put('/:bookingId/cancel', verifyToken, verifyUser, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    console.log('❌ Cancelling booking:', bookingId, 'for user:', userId);

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Check if user owns this booking (via team membership)
    const teamsResponse = await axios.get(`${TEAM_SERVICE_URL}/api/teams/user/${userId}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });

    const userTeams = teamsResponse.data.teams || [];
    const userTeamIds = userTeams.map(team => team._id);

    if (!userTeamIds.includes(booking.teamId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel bookings for your teams'
      });
    }

    // Check if cancellation is allowed (12+ hours before)
    const now = new Date();
    const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`);
    const timeDifference = bookingDateTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 12) {
      return res.status(400).json({
        success: false,
        message: 'Bookings can only be cancelled at least 12 hours in advance'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;
    await booking.save();

    console.log('✅ Booking cancelled successfully:', bookingId);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: booking
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

module.exports = router;
