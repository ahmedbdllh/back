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
  AlertCircle
} from 'lucide-react';
import { calendarService, bookingService } from '../services/bookingService';
import { teamBookingService } from '../services/teamBookingService';
import { useToast, ToastContainer } from '../../../shared/ui/components/Toast';

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
    notes: '',
    price: 0
  });
  const [error, setError] = useState(null);

  // Toast notifications
  const { toasts, success, error: showError, info, removeToast } = useToast();

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
      
      slots.push({
        startTime: timeString,
        isAvailable: true,
        id: `slot-${timeString}`
      });
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

  // Calculate booking price
  const calculatePrice = () => {
    if (!court?.schedule?.pricing) {
      // Fallback pricing
      const pricePerHour = court?.pricePerHour || 50;
      const hours = bookingDetails.duration / 60;
      return pricePerHour * hours;
    }
    
    const pricing = court.schedule.pricing;
    const hours = bookingDetails.duration / 60;
    return pricing.pricePerMatch || (pricing.pricePerHour * hours) || 50;
  };

  // Update price when duration or court changes
  useEffect(() => {
    const price = calculatePrice();
    setBookingDetails(prev => ({
      ...prev,
      price: price
    }));
  }, [bookingDetails.duration, court]);

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
      // Generate slots based on court's configured working hours
      const slots = generateSlots(selectedDate);
      setAvailableSlots(slots);
      
      // Optionally, you can still fetch existing bookings to mark slots as unavailable
      // const dateStr = selectedDate.toISOString().split('T')[0];
      // const response = await calendarService.getAvailableSlots(court._id, dateStr);
      // const existingBookings = response.bookedSlots || [];
      // Mark slots as unavailable if they're already booked
      
    } catch (err) {
      setError('Failed to load available slots');
      console.error('Slots fetch error:', err);
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
    setSelectedSlot(slot);
    setBookingDetails(prev => ({
      ...prev,
      duration: court?.matchTime || 90 // Use court's fixed match duration
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
      
      const bookingData = {
        courtId: court._id,
        teamId: bookingDetails.teamId,
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedSlot.startTime,
        notes: bookingDetails.notes || ''
      };

      console.log('📝 Submitting team booking with data:', bookingData);
      console.log('🏆 Selected team:', selectedTeam);
      console.log('� Team ID being sent:', bookingDetails.teamId);
      console.log('�🏟️ Court details:', court);
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
        throw new Error('User ID not found in token or user object');
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
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await teamBookingService.createTeamBooking(bookingData, token);
      
      console.log('✅ Booking response:', response);
      
      if (response.success) {
        console.log('🎉 Booking created successfully!');
        
        // Show success toast
        success('Booking created successfully! You will receive a confirmation email.', 6000);
        
        onBookingComplete && onBookingComplete(response.booking);
        onClose();
        // Reset state
        setBookingStep('calendar');
        setSelectedDate(null);
        setSelectedSlot(null);
        setBookingDetails({
          teamId: null,
          duration: court?.matchTime || 90, // Use court's fixed match duration
          notes: '',
          price: 0
        });
      } else {
        console.log('❌ Booking failed - response not successful:', response);
        throw new Error(response.message || 'Booking was not successful');
      }
    } catch (err) {
      console.error('💥 Booking error details:', err);
      console.error('💥 Error message:', err.message);
      console.error('💥 Full error:', err);
      
      // Show error toast
      showError(err.message || 'Failed to create booking', 6000);
      
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
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-white/60">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendar.map((date, index) => {
          const dateObj = new Date(date.date);
          const isSelected = selectedDate && dateObj.toDateString() === selectedDate.toDateString();
          const isToday = dateObj.toDateString() === today.toDateString();
          
          return (
            <motion.button
              key={index}
              onClick={() => handleDateSelect(date)}
              disabled={date.isPast || date.isBlocked || !date.isOpen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                p-2 text-sm rounded-lg transition-all relative
                ${isSelected 
                  ? 'bg-blue-600 text-white' 
                  : date.isPast || date.isBlocked || !date.isOpen
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }
                ${isToday ? 'ring-2 ring-blue-400' : ''}
              `}
            >
              <div className="flex flex-col items-center">
                <span>{dateObj.getDate()}</span>
                {date.availableSlots > 0 && (
                  <div className="w-1 h-1 bg-green-400 rounded-full mt-1"></div>
                )}
                {date.bookedSlots > 0 && (
                  <div className="text-xs text-orange-300 mt-1">
                    {date.bookedSlots}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderTimeSlots = () => {
    if (!selectedDate || availableSlots.length === 0) {
      return (
        <div className="text-center py-8 text-white/60">
          {selectedDate ? 'No available slots for this date' : 'Select a date to view available slots'}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {availableSlots.map((slot, index) => (
          <motion.button
            key={index}
            onClick={() => handleSlotSelect(slot)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              p-3 rounded-lg border transition-all
              ${selectedSlot?.startTime === slot.startTime
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
              }
            `}
          >
            <div className="text-sm font-medium">{convertTo12Hour(slot.startTime)}</div>
          </motion.button>
        ))}
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
          className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Book {court?.name}</h2>
                <div className="flex items-center text-white/60 mt-1">
                  <MapPin size={16} className="mr-1" />
                  <span className="text-sm">{court?.location?.address}, {court?.location?.city}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
            
            {/* Step indicator */}
            <div className="flex items-center mt-4 space-x-4">
              {['Calendar', 'Details', 'Confirmation'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index === 0 && bookingStep === 'calendar' ? 'bg-blue-600 text-white' :
                      index === 1 && bookingStep === 'details' ? 'bg-blue-600 text-white' :
                      index === 2 && bookingStep === 'confirmation' ? 'bg-blue-600 text-white' :
                      'bg-white/10 text-white/60'}
                  `}>
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm text-white/80">{step}</span>
                  {index < 2 && <ChevronRight size={16} className="text-white/40 ml-4" />}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
                <AlertCircle size={20} className="text-red-400 mr-2" />
                <span className="text-red-300">{error}</span>
              </div>
            )}

            {bookingStep === 'calendar' && (
              <div className="space-y-6">
                {/* Month navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <h3 className="text-xl font-semibold text-white">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronRight size={20} className="text-white" />
                  </button>
                </div>

                {/* Calendar grid */}
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  renderCalendarGrid()
                )}

                {/* Time slots */}
                {selectedDate && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">
                      Available slots for {selectedDate.toLocaleDateString()}
                    </h4>
                    {renderTimeSlots()}
                  </div>
                )}
              </div>
            )}

            {bookingStep === 'details' && selectedSlot && (
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-2">Booking Summary</h4>
                  <div className="space-y-2 text-sm text-white/80">
                    <div>Date: {selectedDate.toLocaleDateString()}</div>
                    <div>Time: {convertTo12Hour(selectedSlot.startTime)} - {calculateEndTime(selectedSlot.startTime, bookingDetails.duration)}</div>
                    <div>Duration: {bookingDetails.duration} minutes</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Select Team
                    </label>
                    {loadingTeams ? (
                      <div className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                        Loading teams...
                      </div>
                    ) : (
                      <select
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
                        className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                        style={{
                          backgroundColor: '#1f2937',
                          color: '#ffffff'
                        }}
                        required
                      >
                        <option value="" className="bg-gray-800 text-white">Select your team</option>
                        {console.log('🏆 Rendering teams dropdown - userTeams:', userTeams, 'count:', userTeams.length)}
                        {userTeams.map((team) => {
                          console.log('🏆 Rendering team:', team);
                          return (
                            <option 
                              key={team._id} 
                              value={team._id} 
                              className="bg-gray-800 text-white hover:bg-gray-700"
                              style={{
                                backgroundColor: '#1f2937',
                                color: '#ffffff'
                              }}
                            >
                              {team.name} ({team.members?.length || 0} members)
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Match Duration (Set by Manager)
                    </label>
                    <div className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                      {bookingDetails.duration} minutes ({(bookingDetails.duration / 60).toFixed(1)} hours)
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Price
                    </label>
                    <div className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-semibold">
                      {court?.pricePerHour ? `${court.pricePerHour} DT` : 'Price not set'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={bookingDetails.notes}
                      onChange={(e) => setBookingDetails(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Any special requirements or notes..."
                    />
                  </div>
                </div>
              </div>
            )}

            {bookingStep === 'confirmation' && (
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-white mb-4">Booking Confirmation</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar size={16} className="text-blue-400 mr-2" />
                        <span className="text-white/80">
                          {selectedDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={16} className="text-blue-400 mr-2" />
                        <span className="text-white/80">
                          {convertTo12Hour(selectedSlot.startTime)} - {calculateEndTime(selectedSlot.startTime, bookingDetails.duration)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users size={16} className="text-blue-400 mr-2" />
                        <span className="text-white/80">
                          {selectedTeam ? selectedTeam.name : 'No team selected'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Duration:</span>
                        <span className="text-white">{bookingDetails.duration} minutes</span>
                      </div>
                    </div>
                  </div>

                  {bookingDetails.notes && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-white/60">Notes:</p>
                      <p className="text-white/80">{bookingDetails.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex justify-between">
            <button
              onClick={bookingStep === 'calendar' ? onClose : handlePrevStep}
              className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              {bookingStep === 'calendar' ? 'Cancel' : 'Back'}
            </button>
            
            <button
              onClick={bookingStep === 'confirmation' ? handleBookingSubmit : handleNextStep}
              disabled={
                loading || 
                (bookingStep === 'calendar' && !selectedSlot) ||
                (bookingStep === 'details' && !bookingDetails.teamId)
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
              ) : bookingStep === 'confirmation' ? (
                <Check size={16} className="mr-2" />
              ) : null}
              {loading ? 'Processing...' : 
               bookingStep === 'confirmation' ? 'Confirm Booking' : 'Continue'}
            </button>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AnimatePresence>
  );
};

export default BookingCalendar;
