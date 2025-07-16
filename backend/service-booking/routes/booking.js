const express = require('express');
const router = express.Router();
const moment = require('moment');
const axios = require('axios');
const Booking = require('../models/Booking');
const CalendarConfig = require('../models/CalendarConfig');
const { verifyToken, verifyUser, validateBookingAccess } = require('../middleware/auth');

// Service URLs
const COURT_SERVICE_URL = process.env.COURT_SERVICE_URL || 'http://localhost:5003';
const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://localhost:5001';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';

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
      endTime,
      teamSize,
      players = [],
      notes
    } = req.body;

    // Validate required fields
    if (!courtId || !date || !startTime || !endTime || !teamSize) {
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

    // Get company details
    const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${companyId}`);
    if (!companyResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const company = companyResponse.data.company;

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
          managerEmail: company.managerEmail
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

    // Calculate duration
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    if (duration < calendarConfig.minBookingDuration) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking duration is ${calendarConfig.minBookingDuration} minutes`
      });
    }

    if (duration > calendarConfig.maxBookingDuration) {
      return res.status(400).json({
        success: false,
        message: `Maximum booking duration is ${calendarConfig.maxBookingDuration} minutes`
      });
    }

    // Check for conflicts
    const hasConflict = await Booking.findOne({
      courtId,
      date: bookingDate,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

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
      status: calendarConfig.autoConfirmBookings ? 'confirmed' : 'pending',
      courtDetails: {
        name: court.name,
        type: court.type,
        address: court.location?.address,
        city: court.location?.city
      },
      companyDetails: {
        companyName: company.companyName,
        managerName: company.managerName,
        managerEmail: company.managerEmail,
        managerPhone: company.managerPhone
      },
      userDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      }
    });

    await booking.save();

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

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
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
// @desc    Cancel/Delete booking
// @access  Private
router.delete('/:bookingId', verifyToken, verifyUser, validateBookingAccess, async (req, res) => {
  try {
    const booking = req.booking;
    const { reason } = req.body;

    // Check cancellation policy
    const calendarConfig = await CalendarConfig.findOne({ courtId: booking.courtId });
    if (calendarConfig && calendarConfig.cancellationPolicy.allowCancellation) {
      const bookingDateTime = new Date(`${booking.date.toDateString()} ${booking.startTime}`);
      const now = new Date();
      const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

      if (hoursUntilBooking < calendarConfig.cancellationPolicy.cancellationDeadlineHours) {
        return res.status(400).json({
          success: false,
          message: `Cancellation must be done at least ${calendarConfig.cancellationPolicy.cancellationDeadlineHours} hours before the booking`
        });
      }
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

module.exports = router;
