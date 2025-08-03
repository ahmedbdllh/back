import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingService } from '../services/bookingService';

const FullCalendarBooking = ({ courtId, courtName, onClose }) => {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate time slots from 4:00 AM to 23:30 PM with 90-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    let hour = 4; // Start at 4 AM
    let minute = 0;
    
    while (hour < 23 || (hour === 23 && minute <= 30)) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endHour = hour + Math.floor((minute + 90) / 60);
      const endMinute = (minute + 90) % 60;
      const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      slots.push({
        startTime: timeString,
        endTime: endTimeString,
        duration: 90,
        available: true
      });
      
      minute += 90;
      if (minute >= 60) {
        hour += Math.floor(minute / 60);
        minute = minute % 60;
      }
    }
    
    return slots;
  };

  useEffect(() => {
    if (selectedDate) {
      loadBookingsForDate(selectedDate);
    }
  }, [selectedDate, courtId]);

  const loadBookingsForDate = async (date) => {
    try {
      setLoading(true);
      const formattedDate = date.toISOString().split('T')[0];
      const response = await bookingService.getCourtBookings(courtId, {
        date: formattedDate
      });
      
      setBookings(response.bookings || []);
      updateSlotAvailability(response.bookings || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateSlotAvailability = (dayBookings) => {
    const slots = generateTimeSlots();
    const updatedSlots = slots.map(slot => {
      const isBooked = dayBookings.some(booking => {
        return (slot.startTime >= booking.startTime && slot.startTime < booking.endTime) ||
               (slot.endTime > booking.startTime && slot.endTime <= booking.endTime) ||
               (slot.startTime <= booking.startTime && slot.endTime >= booking.endTime);
      });
      
      return {
        ...slot,
        available: !isBooked,
        booking: isBooked ? dayBookings.find(booking => 
          (slot.startTime >= booking.startTime && slot.startTime < booking.endTime) ||
          (slot.endTime > booking.startTime && slot.endTime <= booking.endTime) ||
          (slot.startTime <= booking.startTime && slot.endTime >= booking.endTime)
        ) : null
      };
    });
    
    setTimeSlots(updatedSlots);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleSlotClick = (slot) => {
    if (slot.available) {
      // Handle booking logic here
      console.log('Selected slot:', slot);
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isPast = date < today.setHours(0, 0, 0, 0);
      
      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateSelect(date)}
          disabled={isPast}
          className={`
            h-10 w-10 rounded-lg text-sm font-medium transition-colors
            ${isPast 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
            }
            ${isToday ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
            ${isSelected && !isToday ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600' : ''}
            ${!isSelected && !isToday && !isPast ? 'text-gray-700' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const renderTimeSlots = () => {
    if (!selectedDate || !timeSlots.length) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available Time Slots - {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
          {timeSlots.map((slot, index) => (
            <button
              key={index}
              onClick={() => handleSlotClick(slot)}
              disabled={!slot.available}
              className={`
                p-3 rounded-lg border text-sm font-medium transition-colors
                ${slot.available 
                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300' 
                  : 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed'
                }
              `}
            >
              <div className="text-center">
                <div className="font-semibold">
                  {slot.startTime} - {slot.endTime}
                </div>
                <div className="text-xs mt-1">
                  {slot.available ? 'Available' : 'Booked'}
                </div>
                {slot.booking && (
                  <div className="text-xs text-red-600 mt-1">
                    {slot.booking.userDetails?.name || 'Reserved'}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Book Court: {courtName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Full schedule available from 4:00 AM to 11:30 PM daily
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar Section */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ←
                  </button>
                  <span className="px-4 py-2 font-medium">
                    {currentDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                {renderCalendar()}
              </div>

              {selectedDate && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Schedule Information</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• Operating Hours: 4:00 AM - 11:30 PM</div>
                    <div>• Session Duration: 90 minutes</div>
                    <div>• Time Slots: Every 1.5 hours</div>
                    <div>• Total Daily Slots: {timeSlots.length}</div>
                    <div>• Available Slots: {timeSlots.filter(slot => slot.available).length}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Time Slots Section */}
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="ml-4 text-gray-600">Loading time slots...</p>
                </div>
              ) : (
                renderTimeSlots()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullCalendarBooking;
