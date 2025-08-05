import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  CreditCard, 
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Star,
  Trophy,
  Timer,
  DollarSign,
  CheckCircle,
  PlayCircle,
  UserCheck
} from 'lucide-react';
import { calendarService, bookingService } from '../services/bookingService';
import { teamBookingService } from '../services/teamBookingService';

const BookingCalendar = ({ court, isOpen, onClose, onBookingComplete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState('calendar'); // calendar, details, confirmation
  const [userTeams, setUserTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    teamId: null,
    duration: court?.matchTime || 90, // Use court's fixed match duration
    notes: ''
  });
  const [error, setError] = useState(null);

  // Helper function to convert 24-hour to 12-hour format
  const convertTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  // Generate time slots based on court's working hours for specific day
  const generateSlots = (date) => {
    const slots = [];
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    
    console.log('=== SLOT GENERATION DEBUG ===');
    console.log('Generating slots for:', dayOfWeek, 'date:', date.toDateString());
    console.log('Full court object:', court);
    console.log('Court schedule data:', court?.schedule);
    console.log('Working hours object:', court?.schedule?.workingHours);
    console.log('Court opening/closing fallback:', court?.openingTime, court?.closingTime);
    
    // Get the day-specific schedule from court data (if available) or use default opening/closing times
    let startTime, endTime;
    
    // First, try to get day-specific schedule from the saved schedule configuration
    if (court?.schedule?.workingHours?.[dayOfWeek]) {
      const daySchedule = court.schedule.workingHours[dayOfWeek];
      console.log('✅ Using day-specific schedule for', dayOfWeek, ':', daySchedule);
      if (!daySchedule.isOpen) {
        console.log('❌ Court is closed on', dayOfWeek);
        return []; // No slots if court is closed on this day
      }
      startTime = daySchedule.start;
      endTime = daySchedule.end;
      console.log('📅 Day-specific times:', startTime, 'to', endTime);
    } else {
      console.log('⚠️ No day-specific schedule found, using fallback');
      console.log('Available working hours keys:', Object.keys(court?.schedule?.workingHours || {}));
      // Fallback to general opening/closing times
      startTime = court?.openingTime || '08:00';
      endTime = court?.closingTime || '22:00';
      console.log('⏰ Fallback times:', startTime, 'to', endTime);
    }
    
    console.log('🔧 Using start time:', startTime, 'end time:', endTime);
    console.log('⚡ Match duration:', court?.matchTime, 'minutes');
    
    const matchDuration = court?.matchTime || 90;

    // Convert 12-hour format to 24-hour format if needed
    const convertTo24HourIfNeeded = (time) => {
      if (time.includes('AM') || time.includes('PM')) {
        const [timePart, period] = time.split(' ');
        const [hours, minutes] = timePart.split(':');
        let hour = parseInt(hours);
        
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
      }
      return time;
    };

    const startTime24 = convertTo24HourIfNeeded(startTime);
    const endTime24 = convertTo24HourIfNeeded(endTime);

    const [startHour, startMinute] = startTime24.split(':').map(Number);
    const [endHour, endMinute] = endTime24.split(':').map(Number);

    let startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    // Handle overnight schedules (e.g., 06:00 AM to 02:00 AM next day)
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours to handle next day
    }

    for (let currentMinutes = startMinutes; currentMinutes + matchDuration <= endMinutes; currentMinutes += matchDuration) {
      const actualMinutes = currentMinutes % (24 * 60); // Handle day overflow
      const hours = Math.floor(actualMinutes / 60);
      const minutes = actualMinutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Add time-awareness: filter out past slots for today
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      if (isToday) {
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const slotStartMinutes = hours * 60 + minutes;
        const timeBuffer = 30; // 30-minute buffer for realistic booking
        
        // Only add future slots (with buffer) for today
        if (slotStartMinutes > currentTimeInMinutes + timeBuffer) {
          slots.push({
            startTime: timeString,
            isAvailable: true,
            id: `slot-${timeString}`
          });
        }
      } else {
        // For future dates, add all slots
        slots.push({
          startTime: timeString,
          isAvailable: true,
          id: `slot-${timeString}`
        });
      }
    }

    return slots;
  };

  // Fetch user's teams
  const fetchUserTeams = async () => {
    try {
      setLoadingTeams(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching teams for user');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        console.error('❌ User not authenticated - no token');
        setError('User not authenticated');
        return;
      }

      const url = `http://localhost:5004/api/teams/user/me`;
      console.log('📡 Fetching teams from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📋 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Teams data received:', data);
        
        // The response might be { teams: [...] } or just an array
        const teams = data.teams || data || [];
        setUserTeams(teams);
        
        // Auto-select first team if available
        if (teams && teams.length > 0) {
          console.log('🎯 Auto-selecting first team:', teams[0]);
          setSelectedTeam(teams[0]);
          setBookingDetails(prev => ({
            ...prev,
            teamId: teams[0]._id
          }));
        } else {
          console.log('⚠️ No teams found for user');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch user teams:', response.status, errorText);
      }
    } catch (error) {
      console.error('💥 Error fetching teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    if (isOpen && court) {
      fetchCalendarData();
      fetchUserTeams(); // Fetch teams when modal opens
    }
  }, [isOpen, court, currentDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await calendarService.getCourtCalendar(
        court._id,
        currentDate.getMonth() + 1,
        currentDate.getFullYear()
      );
      setCalendarData(response);
      setError(null);
    } catch (err) {
      setError('Failed to load calendar data');
      console.error('Calendar fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
            
      // Fetch all slots with their booking status (available/booked) for visual indicators
      const apiUrl = `${process.env.REACT_APP_BOOKING_SERVICE_URL || 'http://localhost:5005/api'}/bookings/slots-with-status/${court._id}/${dateStr}`;
      console.log('📡 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📋 Response status:', response.status);
      const data = await response.json();
      console.log('📊 API Response:', data);
      
      if (data.success) {
        // Set all slots (both available and booked) for visual display
        setAvailableSlots(data.allSlots || []);
        console.log(`📅 Loaded ${data.allSlots?.length || 0} total slots (${data.availableCount} available, ${data.bookedCount} booked) for ${dateStr}`);
        console.log('🎯 First few slots:', data.allSlots?.slice(0, 3));
      } else {
        console.warn('❌ API failed, falling back to manual slot generation');
        // Fallback to generating slots manually if API fails
        const slots = generateSlots(selectedDate);
        setAvailableSlots(slots);
      }
      
    } catch (err) {
      console.error('Slots fetch error:', err);
      console.warn('❌ API error, falling back to manual slot generation');
      // Fallback to generating slots manually
      const slots = generateSlots(selectedDate);
      setAvailableSlots(slots);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    if (date.isPast || date.isBlocked || !date.isOpen) return;
    setSelectedDate(new Date(date.date));
    setSelectedSlot(null);
    setBookingStep('calendar');
  };

  const handleSlotSelect = (slot) => {
    // Normalize slot data to handle both old and new formats
    const normalizedSlot = {
      startTime: slot.startTime || slot.time,
      endTime: slot.endTime,
      duration: slot.duration || court?.matchTime || 90,
      price: slot.price,
      ...slot
    };
    
    setSelectedSlot(normalizedSlot);
    setBookingDetails(prev => ({
      ...prev,
      duration: normalizedSlot.duration // Use slot's duration or court's fixed match duration
    }));
  };

  const handleNextStep = () => {
    if (bookingStep === 'calendar' && selectedSlot) {
      setBookingStep('details');
    } else if (bookingStep === 'details') {
      setBookingStep('confirmation');
    }
  };

  const handlePrevStep = () => {
    if (bookingStep === 'details') {
      setBookingStep('calendar');
    } else if (bookingStep === 'confirmation') {
      setBookingStep('details');
    }
  };

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = (hours * 60 + minutes + duration) % (24 * 60);
    const endHours = Math.floor(endMinutes / 60);
    const remainingMinutes = endMinutes % 60;
    const endTime24 = `${endHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
    return convertTo12Hour(endTime24);
  };

  const handleBookingSubmit = async () => {
    try {
      setLoading(true);
      
      // Get user authentication data first
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('🔐 Auth debugging:');
      console.log('- Token exists:', !!token);
      console.log('- Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('- User object:', user);
      console.log('- User ID (_id):', user._id);
      console.log('- User ID (id):', user.id);
      console.log('- User ID (userId):', user.userId);
      console.log('- All user keys:', Object.keys(user));
      
      // Try to decode the JWT token to see what's inside
      if (token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          console.log('- JWT payload:', tokenPayload);
          console.log('- JWT user ID field:', tokenPayload.id || tokenPayload.userId || tokenPayload._id || tokenPayload.sub);
        } catch (e) {
          console.log('- Could not decode JWT:', e.message);
        }
      }
      
      // Try to get user ID from JWT token if not in localStorage user object
      let userId = user._id || user.id || user.userId;
      
      if (!userId && token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          userId = tokenPayload.id || tokenPayload.userId || tokenPayload._id || tokenPayload.sub;
          console.log('- Extracted user ID from JWT:', userId);
        } catch (e) {
          console.log('- Could not decode JWT:', e.message);
        }
      }
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      const bookingData = {
        courtId: court._id,
        teamId: bookingDetails.teamId,
        userId: userId, // Add explicit user ID
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedSlot.startTime,
        notes: bookingDetails.notes || ''
      };

      console.log('📝 Submitting team booking with data:', bookingData);
      console.log('🏆 Selected team:', selectedTeam);
      console.log('🏆 Team ID being sent:', bookingDetails.teamId);
      console.log('🏟️ Court details:', court);
      console.log('🏟️ Court ID being sent:', court._id);
      console.log('📅 Selected date:', selectedDate);
      console.log('📅 Date being sent:', selectedDate.toISOString().split('T')[0]);
      console.log('⏰ Selected slot:', selectedSlot);
      console.log('⏰ Start time being sent:', selectedSlot.startTime);
      
      // Validate that we have all required data
      if (!court._id) {
        throw new Error('Court ID is missing');
      }
      if (!bookingDetails.teamId) {
        throw new Error('Team ID is missing - please select a team');
      }
      if (!selectedDate) {
        throw new Error('Date is missing');
      }
      if (!selectedSlot.startTime) {
        throw new Error('Start time is missing');
      }
      
      console.log('- Final user ID:', userId);
      
      // Test auth service verify endpoint
      console.log('🔍 Testing auth service verification...');
      try {
        const authTestResponse = await fetch('http://localhost:5000/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('- Auth verify response status:', authTestResponse.status);
        if (authTestResponse.ok) {
          const authData = await authTestResponse.json();
          console.log('- Auth verify response:', authData);
        } else {
          const authError = await authTestResponse.text();
          console.log('- Auth verify error:', authError);
        }
      } catch (authErr) {
        console.log('- Auth service connection error:', authErr.message);
      }
      
      // Test team-booking service auth endpoint
      console.log('🔍 Testing team-booking service authentication...');
      try {
        const teamBookingAuthResponse = await fetch('http://localhost:5005/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('- Team-booking auth verify response status:', teamBookingAuthResponse.status);
        if (teamBookingAuthResponse.ok) {
          const teamAuthData = await teamBookingAuthResponse.json();
          console.log('- Team-booking auth verify response:', teamAuthData);
        } else {
          const teamAuthError = await teamBookingAuthResponse.text();
          console.log('- Team-booking auth verify error:', teamAuthError);
        }
      } catch (teamAuthErr) {
        console.log('- Team-booking service connection error:', teamAuthErr.message);
      }
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      console.log('📤 Final booking data being sent:', JSON.stringify(bookingData, null, 2));
      console.log('🔐 Token being sent to team-booking service:', token ? `${token.substring(0, 50)}...` : 'null');
      
      const response = await teamBookingService.createTeamBooking(bookingData, token);
      
      console.log('✅ Booking response:', response);
      
      if (response.success) {
        console.log('🎉 Booking created successfully!');
        onBookingComplete && onBookingComplete(response.booking);
        onClose();
        // Reset state
        setBookingStep('calendar');
        setSelectedDate(null);
        setSelectedSlot(null);
        setBookingDetails({
          teamId: null,
          duration: court?.matchTime || 90, // Use court's fixed match duration
          notes: ''
        });
      } else {
        console.log('❌ Booking failed - response not successful:', response);
        throw new Error(response.message || 'Booking was not successful');
      }
    } catch (err) {
      console.error('💥 Booking error details:', err);
      console.error('💥 Error message:', err.message);
      console.error('💥 Full error:', err);
      setError(err.message || 'Failed to create booking');
      console.error('Booking submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const renderCalendarGrid = () => {
    if (!calendarData?.calendar) return null;

    const calendar = calendarData.calendar;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth(-1)}
            className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 group"
          >
            <ChevronLeft size={20} className="text-white group-hover:text-blue-400" />
          </motion.button>
          
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-1">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-sm text-white/60">Select your preferred date</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth(1)}
            className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 group"
          >
            <ChevronRight size={20} className="text-white group-hover:text-blue-400" />
          </motion.button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-white/70 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendar.map((date, index) => {
            const dateObj = new Date(date.date);
            const isSelected = selectedDate && dateObj.toDateString() === selectedDate.toDateString();
            const isToday = dateObj.toDateString() === today.toDateString();
            const isAvailable = !date.isPast && !date.isBlocked && date.isOpen;
            
            return (
              <motion.button
                key={index}
                onClick={() => handleDateSelect(date)}
                disabled={!isAvailable}
                whileHover={isAvailable ? { scale: 1.05, y: -2 } : {}}
                whileTap={isAvailable ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.01 }}
                className={`
                  relative p-4 rounded-xl transition-all duration-200 font-medium
                  ${isSelected 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-105' 
                    : isToday
                      ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-white border-2 border-purple-400/50'
                      : !isAvailable
                        ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                        : 'bg-white/5 text-white hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-blue-600/20 hover:border-blue-400/30 border border-white/10'
                  }
                `}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-lg">{dateObj.getDate()}</span>
                  
                  {/* Availability indicators */}
                  <div className="flex items-center space-x-1">
                    {date.availableSlots > 0 && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-green-300 ml-1">{date.availableSlots}</span>
                      </div>
                    )}
                    {date.bookedSlots > 0 && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-xs text-orange-300 ml-1">{date.bookedSlots}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Today indicator */}
                  {isToday && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  
                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2"
                    >
                      <CheckCircle size={16} className="text-white" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimeSlots = () => {
    if (!selectedDate || availableSlots.length === 0) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-2xl border border-white/10"
        >
          <Clock size={48} className="text-white/40 mx-auto mb-4" />
          <p className="text-white/60 text-lg">
            {selectedDate ? 'No available slots for this date' : 'Select a date to view available slots'}
          </p>
          <p className="text-white/40 text-sm mt-2">
            {selectedDate ? 'Try selecting a different date' : 'Choose from the calendar above'}
          </p>
        </motion.div>
      );
    }

    // Get duration from court's configuration
    const duration = court?.matchTime || 90;

    return (
      <div className="space-y-6">
        {/* Slots Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-xl font-bold text-white flex items-center">
              <Timer className="mr-3 text-blue-400" size={24} />
              Available Time Slots
            </h4>
            <p className="text-white/60 mt-1">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-green-400 mb-1">
              <span className="font-bold">
                {court?.schedule?.pricing?.pricePerMatch || court?.pricePerHour || 15} DT Per Person
              </span>
            </div>
            <p className="text-xs text-white/60">{duration} min session</p>
          </div>
        </div>

        {/* Time slots grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableSlots.map((slot, index) => {
            // Check slot booking status from API data
            const startTime = slot.startTime || slot.time;
            const isSelected = selectedSlot?.startTime === startTime;
            const endTime = calculateEndTime(startTime, duration);
            const isBooked = slot.isBooked === true || slot.status === 'booked' || slot.isAvailable === false;
            const isAvailable = !isBooked;
            
            // Debug logging
            console.log(`Slot ${startTime}:`, {
              isBooked: slot.isBooked,
              status: slot.status,
              isAvailable: slot.isAvailable,
              calculated_isBooked: isBooked,
              calculated_isAvailable: isAvailable
            });
            
            return (
              <motion.button
                key={index}
                onClick={() => isAvailable ? handleSlotSelect(slot) : null}
                disabled={isBooked}
                whileHover={isAvailable ? { scale: 1.02, y: -2 } : {}}
                whileTap={isAvailable ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-300 group overflow-hidden
                  ${isBooked
                    ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/50 text-red-300 cursor-not-allowed opacity-75'
                    : isSelected
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                      : 'bg-gradient-to-br from-white/5 to-white/10 border-white/20 text-white hover:border-blue-400/50 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-blue-600/10 cursor-pointer'
                  }
                `}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className={`absolute inset-0 ${
                    isBooked 
                      ? 'bg-gradient-to-br from-red-400/20 to-red-500/20'
                      : 'bg-gradient-to-br from-blue-400/20 to-purple-500/20'
                  }`}></div>
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Clock size={16} className={
                      isBooked 
                        ? 'text-red-400' 
                        : isSelected 
                          ? 'text-white' 
                          : 'text-blue-400'
                    } />
                    {isSelected && !isBooked && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 0.6 }}
                      >
                        <CheckCircle size={16} className="text-white" />
                      </motion.div>
                    )}
                    {isBooked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                      >
                        <X size={16} className="text-red-400" />
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="text-left">
                    <div className="font-bold text-lg mb-1">
                      {convertTo12Hour(startTime)}
                    </div>
                    <div className={`text-sm ${
                      isBooked 
                        ? 'text-red-300/90'
                        : isSelected 
                          ? 'text-white/90' 
                          : 'text-white/60'
                    }`}>
                      {`to ${endTime}`}
                    </div>
                    <div className={`text-xs mt-2 ${
                      isBooked
                        ? 'text-red-300/80'
                        : isSelected 
                          ? 'text-white/80' 
                          : 'text-white/50'
                    }`}>
                      {duration} minutes
                    </div>
                    {/* Show booking status */}
                    {isBooked && slot.bookingDetails && (
                      <div className="text-xs mt-2 space-y-1">
                        <div className="text-red-300/90 font-medium">
                          Booked by {slot.bookingDetails.teamName || slot.bookingDetails.playerName || 'Player'}
                        </div>
                        {slot.bookingDetails.teamName && (
                          <div className="text-red-300/70 text-xs">
                            Team booking
                          </div>
                        )}
                      </div>
                    )}
                    {isBooked && !slot.bookingDetails && (
                      <div className="text-xs mt-2 text-red-300/90 font-medium">
                        Already booked
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-500/0 group-hover:from-blue-400/10 group-hover:to-purple-500/10 transition-all duration-300"
                  whileHover={{ opacity: 1 }}
                />
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center text-sm text-white/60">
            <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mr-2"></div>
            Selected
          </div>
          <div className="flex items-center text-sm text-white/60">
            <div className="w-3 h-3 bg-white/20 rounded-full mr-2"></div>
            Available
          </div>
          <div className="flex items-center text-sm text-white/60">
            <div className="w-3 h-3 bg-gradient-to-br from-red-500 to-red-600 rounded-full mr-2"></div>
            Booked
          </div>
          <div className="flex items-center text-sm text-white/60">
            <Timer size={14} className="mr-2 text-green-400" />
            {duration} min sessions
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-white/10 flex flex-col"
        >
          {/* Header */}
          <div className="relative p-8 border-b border-white/10 flex-shrink-0">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <PlayCircle size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Book {court?.name}
                    </h2>
                    <div className="flex items-center text-white/60 mt-2">
                      <MapPin size={16} className="mr-2 text-blue-400" />
                      <span className="text-sm">{court?.location?.address}, {court?.location?.city}</span>
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <X size={24} className="text-white" />
                </motion.button>
              </div>
              
              {/* Enhanced Step indicator */}
              <div className="flex items-center justify-center mt-8 space-x-8">
                {[
                  { step: 'Calendar', icon: Calendar, key: 'calendar' },
                  { step: 'Details', icon: UserCheck, key: 'details' },
                  { step: 'Confirmation', icon: CheckCircle, key: 'confirmation' }
                ].map((item, index) => {
                  const isActive = bookingStep === item.key;
                  const isCompleted = (
                    (item.key === 'calendar' && (bookingStep === 'details' || bookingStep === 'confirmation')) ||
                    (item.key === 'details' && bookingStep === 'confirmation')
                  );
                  
                  return (
                    <div key={item.step} className="flex items-center">
                      <motion.div 
                        className="flex items-center space-x-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`
                          relative w-12 h-12 rounded-xl flex items-center justify-center font-medium text-sm transition-all duration-300
                          ${isActive 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                            : isCompleted
                              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                              : 'bg-white/10 text-white/60 border border-white/20'}
                        `}>
                          {isCompleted ? (
                            <Check size={20} />
                          ) : (
                            <item.icon size={20} />
                          )}
                          
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 rounded-xl bg-blue-400/20"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </div>
                        
                        <div className="text-left">
                          <span className={`font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                            {item.step}
                          </span>
                          {isActive && (
                            <div className="text-xs text-blue-400 mt-1">Current step</div>
                          )}
                        </div>
                      </motion.div>
                      
                      {index < 2 && (
                        <div className={`w-12 h-px mx-4 transition-all duration-300 ${
                          isCompleted ? 'bg-green-400' : 'bg-white/20'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto flex-1 min-h-0">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl flex items-center backdrop-blur-sm"
              >
                <AlertCircle size={20} className="text-red-400 mr-3" />
                <span className="text-red-300 font-medium">{error}</span>
              </motion.div>
            )}

            {bookingStep === 'calendar' && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Calendar grid */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-white/60">Loading calendar...</p>
                  </div>
                ) : (
                  renderCalendarGrid()
                )}

                {/* Time slots */}
                {selectedDate && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {renderTimeSlots()}
                  </motion.div>
                )}
              </motion.div>
            )}

            {bookingStep === 'details' && selectedSlot && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Booking Summary Card */}
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm">
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Star className="mr-3 text-yellow-400" size={24} />
                    Booking Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Calendar size={18} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Date</p>
                        <p className="text-white font-medium">{selectedDate.toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Clock size={18} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Time</p>
                        <p className="text-white font-medium">
                          {convertTo12Hour(selectedSlot.startTime)} - {calculateEndTime(selectedSlot.startTime, bookingDetails.duration)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Timer size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Duration</p>
                        <p className="text-white font-medium">{bookingDetails.duration} minutes</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Team Selection */}
                  <div className="space-y-4">
                    <label className="block text-lg font-semibold text-white mb-3 flex items-center">
                      <Trophy className="mr-3 text-yellow-400" size={20} />
                      Select Your Team
                    </label>
                    {loadingTeams ? (
                      <div className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3"></div>
                        Loading teams...
                      </div>
                    ) : (
                      <motion.select
                        value={bookingDetails.teamId || ''}
                        onChange={(e) => {
                          const teamId = e.target.value;
                          const team = userTeams.find(t => t._id === teamId);
                          setSelectedTeam(team);
                          setBookingDetails(prev => ({
                            ...prev,
                            teamId: teamId
                          }));
                        }}
                        whileFocus={{ scale: 1.02 }}
                        className="w-full p-4 bg-gray-800/50 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                        style={{
                          backgroundColor: 'rgba(31, 41, 55, 0.8)',
                          color: '#ffffff'
                        }}
                        required
                      >
                        <option value="" className="bg-gray-800 text-white">Choose your team</option>
                        {userTeams.map((team) => (
                          <option 
                            key={team._id} 
                            value={team._id} 
                            className="bg-gray-800 text-white"
                          >
                            {team.name} ({team.members?.length || 0} members)
                          </option>
                        ))}
                      </motion.select>
                    )}
                    
                    {selectedTeam && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                            <Users size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{selectedTeam.name}</p>
                            <p className="text-green-400 text-sm">{selectedTeam.members?.length || 0} active members</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Pricing and Duration */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-lg font-semibold text-white mb-3 flex items-center">
                        <Timer className="mr-3 text-blue-400" size={20} />
                        Match Duration
                      </label>
                      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white mb-1">
                            {bookingDetails.duration}
                          </div>
                          <div className="text-blue-400 text-sm uppercase tracking-wider">
                            Minutes ({(bookingDetails.duration / 60).toFixed(1)} hours)
                          </div>
                          <div className="text-xs text-white/60 mt-2">
                            Set by court manager
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-white mb-3 flex items-center">
                        <Timer className="mr-3 text-green-400" size={20} />
                        Pricing
                      </label>
                      <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-400 mb-1">
                            {court?.schedule?.pricing?.pricePerMatch || court?.pricePerHour || 15} DT
                          </div>
                          <div className="text-white/60 text-sm">
                            {court?.schedule?.pricing?.pricePerMatch 
                              ? 'Fixed price per person' 
                              : court?.pricePerHour 
                                ? 'Per hour rate' 
                                : 'Standard rate'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    Additional Notes (Optional)
                  </label>
                  <motion.textarea
                    value={bookingDetails.notes}
                    onChange={(e) => setBookingDetails(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    whileFocus={{ scale: 1.01 }}
                    rows={4}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm resize-none"
                    placeholder="Any special requirements, equipment needs, or notes for this booking..."
                  />
                </div>
              </motion.div>
            )}

            {bookingStep === 'confirmation' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Success Header */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle size={40} className="text-white" />
                  </motion.div>
                  <h4 className="text-2xl font-bold text-white mb-2">
                    Confirm Your Booking
                  </h4>
                  <p className="text-white/60">
                    Please review the details below before confirming
                  </p>
                </div>

                {/* Confirmation Details */}
                <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <Calendar size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white/60 uppercase tracking-wider mb-1">Date & Time</p>
                          <p className="text-white font-semibold text-lg">
                            {selectedDate.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-blue-400 font-medium">
                            {convertTo12Hour(selectedSlot.startTime)} - {calculateEndTime(selectedSlot.startTime, bookingDetails.duration)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <Trophy size={20} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white/60 uppercase tracking-wider mb-1">Team</p>
                          <p className="text-white font-semibold text-lg">
                            {selectedTeam ? selectedTeam.name : 'No team selected'}
                          </p>
                          {selectedTeam && (
                            <p className="text-purple-400 text-sm">
                              {selectedTeam.members?.length || 0} members
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                          <Timer size={20} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white/60 uppercase tracking-wider mb-1">Duration</p>
                          <p className="text-white font-semibold text-lg">
                            {bookingDetails.duration} minutes
                          </p>
                          <p className="text-green-400 text-sm">
                            {(bookingDetails.duration / 60).toFixed(1)} hours session
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                          <Timer size={20} className="text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white/60 uppercase tracking-wider mb-1">Total Price</p>
                          <p className="text-white font-bold text-lg">
                            {court?.schedule?.pricing?.pricePerMatch || court?.pricePerHour || 15} DT
                          </p>
                          <p className="text-yellow-400 text-sm">
                            {court?.schedule?.pricing?.pricePerMatch 
                              ? 'Fixed price per person' 
                              : court?.pricePerHour 
                                ? 'Per hour rate' 
                                : 'Standard rate'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Court Info */}
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                        <MapPin size={20} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white/60 uppercase tracking-wider mb-1">Court Location</p>
                        <p className="text-white font-semibold text-lg">{court?.name}</p>
                        <p className="text-indigo-400 text-sm">
                          {court?.location?.address}, {court?.location?.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {bookingDetails.notes && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <p className="text-sm text-white/60 uppercase tracking-wider mb-2">Additional Notes</p>
                      <p className="text-white/80 bg-white/5 p-4 rounded-lg">{bookingDetails.notes}</p>
                    </div>
                  )}
                </div>

                {/* Warning Message */}
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start space-x-3">
                  <AlertCircle size={20} className="text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-medium">Important Notice</p>
                    <p className="text-white/80 text-sm mt-1">
                      Please arrive 10 minutes before your scheduled time. Cancellations must be made at least 12 hours in advance.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="p-8 border-t border-white/10 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center justify-between">
              <motion.button
                onClick={bookingStep === 'calendar' ? onClose : handlePrevStep}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center space-x-2 font-medium border border-white/20"
              >
                <ChevronLeft size={16} />
                <span>{bookingStep === 'calendar' ? 'Cancel' : 'Back'}</span>
              </motion.button>
              
              <motion.button
                onClick={bookingStep === 'confirmation' ? handleBookingSubmit : handleNextStep}
                disabled={
                  loading || 
                  (bookingStep === 'calendar' && !selectedSlot) ||
                  (bookingStep === 'details' && !bookingDetails.teamId)
                }
                whileHover={!loading ? { scale: 1.05 } : {}}
                whileTap={!loading ? { scale: 0.95 } : {}}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : bookingStep === 'confirmation' ? (
                  <>
                    <CheckCircle size={16} />
                    <span>Confirm Booking</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingCalendar;
