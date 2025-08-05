import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingService } from '../services/bookingService';

const DailyScheduleView = ({ courtId, courtName, selectedDate, onSlotSelect, onClose }) => {
  const { token } = useAuth();
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate comprehensive time slots from 4:00 AM to 23:30 PM
  const generateFullDaySlots = () => {
    const slots = [];
    let currentHour = 4; // Start at 4 AM
    let currentMinute = 0;
    
    while (currentHour < 23 || (currentHour === 23 && currentMinute <= 30)) {
      const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Calculate end time (90 minutes later)
      let endHour = currentHour;
      let endMinute = currentMinute + 90;
      
      while (endMinute >= 60) {
        endHour += 1;
        endMinute -= 60;
      }
      
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      slots.push({
        id: `${startTime}-${endTime}`,
        startTime,
        endTime,
        duration: 90,
        available: true,
        timeSlot: `${startTime} - ${endTime}`,
        period: getPeriodOfDay(currentHour),
        booking: null
      });
      
      // Move to next slot (90 minutes)
      currentMinute += 90;
      while (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }
      
      // Break if we've exceeded our end time
      if (currentHour > 23 || (currentHour === 23 && currentMinute > 30)) {
        break;
      }
    }
    
    return slots;
  };

  const getPeriodOfDay = (hour) => {
    if (hour >= 4 && hour < 6) return 'Early Morning';
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 20) return 'Evening';
    return 'Night';
  };

  const getPeriodColor = (period) => {
    switch (period) {
      case 'Early Morning': return 'bg-indigo-50 border-indigo-200';
      case 'Morning': return 'bg-blue-50 border-blue-200';
      case 'Afternoon': return 'bg-yellow-50 border-yellow-200';
      case 'Evening': return 'bg-orange-50 border-orange-200';
      case 'Night': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadBookingsForDate();
    }
  }, [selectedDate, courtId]);

  const loadBookingsForDate = async () => {
    try {
      setLoading(true);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Load existing bookings for the date
      const response = await bookingService.getCourtBookings(courtId, {
        date: formattedDate
      });
      
      const dayBookings = response.bookings || [];
      setBookings(dayBookings);
      
      // Generate slots and mark availability
      const allSlots = generateFullDaySlots();
      const updatedSlots = allSlots.map(slot => {
        const conflictingBooking = dayBookings.find(booking => {
          return (slot.startTime < booking.endTime && slot.endTime > booking.startTime);
        });
        
        return {
          ...slot,
          available: !conflictingBooking,
          booking: conflictingBooking
        };
      });
      
      setTimeSlots(updatedSlots);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.available && onSlotSelect) {
      onSlotSelect({
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration
      });
    }
  };

  const groupSlotsByPeriod = () => {
    const grouped = {};
    timeSlots.forEach(slot => {
      if (!grouped[slot.period]) {
        grouped[slot.period] = [];
      }
      grouped[slot.period].push(slot);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading full day schedule...</p>
      </div>
    );
  }

  const groupedSlots = groupSlotsByPeriod();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Full Day Schedule - {courtName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold px-4 py-2 hover:bg-gray-100 rounded-lg"
            >
              Close
            </button>
          )}
        </div>
        
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
            <span>Available ({timeSlots.filter(slot => slot.available).length})</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 rounded mr-2"></div>
            <span>Booked ({timeSlots.filter(slot => !slot.available).length})</span>
          </div>
          <div className="text-gray-600">
            Total Slots: {timeSlots.length} | Operating Hours: 4:00 AM - 11:30 PM
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(groupedSlots).map(([period, slots]) => (
          <div key={period} className={`rounded-lg border-2 p-6 ${getPeriodColor(period)}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {period} ({slots.length} slots)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  disabled={!slot.available}
                  className={`
                    p-4 rounded-lg border-2 text-sm font-medium transition-all duration-200 transform hover:scale-105
                    ${slot.available 
                      ? 'bg-white border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 shadow-sm hover:shadow-md cursor-pointer' 
                      : 'bg-gray-100 border-red-300 text-red-700 cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="font-bold text-base">
                      {slot.startTime}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      to {slot.endTime}
                    </div>
                    <div className="text-xs mt-2">
                      {slot.available ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Available
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Booked
                        </span>
                      )}
                    </div>
                    {slot.booking && (
                      <div className="text-xs text-red-600 mt-2 truncate">
                        {slot.booking.userDetails?.name || 'Reserved'}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{timeSlots.length}</div>
            <div className="text-sm text-gray-600">Total Slots</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {timeSlots.filter(slot => slot.available).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {timeSlots.filter(slot => !slot.available).length}
            </div>
            <div className="text-sm text-gray-600">Booked</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">19.5</div>
            <div className="text-sm text-gray-600">Operating Hours</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyScheduleView;
