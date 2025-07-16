const express = require('express');
const router = express.Router();
const moment = require('moment');
const axios = require('axios');
const Booking = require('../models/Booking');
const CalendarConfig = require('../models/CalendarConfig');
const { verifyToken, verifyUser } = require('../middleware/auth');

// Service URLs
const COURT_SERVICE_URL = process.env.COURT_SERVICE_URL || 'http://localhost:5003';
const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://localhost:5001';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';

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
      duration,
      notes
    } = req.body;

    // Validate required fields
    if (!courtId || !teamId || !date || !startTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: courtId, teamId, date, startTime, duration'
      });
    }

    // Verify that the user is the captain of the team
    try {
      const teamResponse = await axios.get(`${AUTH_SERVICE_URL}/api/teams/${teamId}`, {
        headers: { Authorization: req.header('Authorization') }
      });

      if (!teamResponse.data.success) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      const team = teamResponse.data.team;
      
      // Check if the current user is the team captain
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
      const courtResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
      if (!courtResponse.data.success) {
        return res.status(404).json({
          success: false,
          message: 'Court not found'
        });
      }
      courtDetails = courtResponse.data.court;
    } catch (error) {
      console.error('Court verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify court'
      });
    }

    // Get company details
    let companyDetails;
    try {
      const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${courtDetails.companyId}`);
      if (!companyResponse.data.success) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
      companyDetails = companyResponse.data.company;
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

    // Calculate pricing based on schedule configuration
    const schedule = calendarConfig.schedule;
    const pricePerHour = schedule.pricing?.pricePerHour || 50;
    const durationHours = duration / 60;
    let totalPrice = pricePerHour * durationHours;

    // Check if this is an advance booking
    const bookingDate = moment(date);
    const today = moment();
    const daysInAdvance = bookingDate.diff(today, 'days');
    
    if (daysInAdvance >= (schedule.advanceBookingDays || 30)) {
      totalPrice = schedule.pricing?.advanceBookingPrice || totalPrice;
    }

    // Get team details for caching
    const teamResponse = await axios.get(`${AUTH_SERVICE_URL}/api/teams/${teamId}`, {
      headers: { Authorization: req.header('Authorization') }
    });
    const team = teamResponse.data.team;

    // Get captain details
    const captainResponse = await axios.get(`${AUTH_SERVICE_URL}/api/auth/user/${team.captain}`, {
      headers: { Authorization: req.header('Authorization') }
    });
    const captain = captainResponse.data.user;

    // Create the team booking
    const booking = new Booking({
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
      status: schedule.autoConfirmBookings ? 'confirmed' : 'pending',
      // Cached details
      courtDetails: {
        name: courtDetails.name,
        type: courtDetails.type,
        address: courtDetails.address,
        city: courtDetails.city
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
        teamName: team.teamName,
        captainName: captain.fullName,
        captainEmail: captain.email,
        memberCount: team.members?.length || 1
      }
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Team booking created successfully',
      booking: {
        id: booking._id,
        courtName: courtDetails.name,
        teamName: team.teamName,
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
    console.error('Team booking creation error:', error);
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
      const teamResponse = await axios.get(`${AUTH_SERVICE_URL}/api/teams/${teamId}`, {
        headers: { Authorization: req.header('Authorization') }
      });

      if (!teamResponse.data.success) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      const team = teamResponse.data.team;
      const isMember = team.members?.includes(req.user.userId) || team.captain.toString() === req.user.userId.toString();
      
      if (!isMember) {
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

    // Get calendar configuration
    const calendarConfig = await CalendarConfig.findOne({ courtId });
    if (!calendarConfig) {
      return res.status(404).json({
        success: false,
        message: 'Court schedule not configured'
      });
    }

    const schedule = calendarConfig.schedule;
    const selectedDate = moment(date);
    const dayOfWeek = selectedDate.format('dddd').toLowerCase();
    
    // Check if court is open on this day
    const workingHours = schedule.workingHours[dayOfWeek];
    if (!workingHours || !workingHours.isOpen) {
      return res.json({
        success: true,
        availableSlots: [],
        message: 'Court is closed on this day'
      });
    }

    // Get available slots using the static method
    const availableSlots = await Booking.getAvailableSlots(courtId, new Date(date), workingHours);
    
    // Get available match durations from schedule
    const availableMatchDurations = schedule.pricing?.availableMatchDurations || [60, 90, 120];
    const pricePerHour = schedule.pricing?.pricePerHour || 50;

    // Format response with pricing information
    const slotsWithPricing = availableSlots.map(slot => {
      const slotPricing = availableMatchDurations.map(duration => {
        const hours = duration / 60;
        const price = pricePerHour * hours;
        return {
          duration,
          durationLabel: `${duration}min`,
          price,
          priceLabel: `${price} DT`
        };
      });

      return {
        time: slot,
        availableDurations: slotPricing
      };
    });

    res.json({
      success: true,
      date: selectedDate.format('YYYY-MM-DD'),
      dayOfWeek: dayOfWeek,
      workingHours: workingHours,
      availableSlots: slotsWithPricing,
      pricePerHour
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
