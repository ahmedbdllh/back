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

const BookingCalendar = ({ court, isOpen, onClose, onBookingComplete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState('calendar'); // calendar, details, confirmation
  const [bookingDetails, setBookingDetails] = useState({
    teamSize: 1,
    duration: 60,
    notes: '',
    players: []
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && court) {
      fetchCalendarData();
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
      const response = await calendarService.getAvailableSlots(court._id, dateStr);
      setAvailableSlots(response.availableSlots || []);
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
      duration: 60 // Default 1 hour
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
    return `${endHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
  };

  const calculateTotalPrice = () => {
    if (!selectedSlot || !bookingDetails.duration) return 0;
    const hours = bookingDetails.duration / 60;
    return Math.round(selectedSlot.pricePerHour * hours * 100) / 100;
  };

  const handleBookingSubmit = async () => {
    try {
      setLoading(true);
      
      const bookingData = {
        courtId: court._id,
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedSlot.startTime,
        endTime: calculateEndTime(selectedSlot.startTime, bookingDetails.duration),
        teamSize: bookingDetails.teamSize,
        notes: bookingDetails.notes,
        players: bookingDetails.players
      };

      const response = await bookingService.createBooking(bookingData);
      
      if (response.success) {
        onBookingComplete && onBookingComplete(response.booking);
        onClose();
        // Reset state
        setBookingStep('calendar');
        setSelectedDate(null);
        setSelectedSlot(null);
        setBookingDetails({
          teamSize: 1,
          duration: 60,
          notes: '',
          players: []
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
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
            <div className="text-sm font-medium">{slot.startTime}</div>
            <div className="text-xs text-white/70">${slot.pricePerHour}/hr</div>
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
                    <div>Time: {selectedSlot.startTime} - {calculateEndTime(selectedSlot.startTime, bookingDetails.duration)}</div>
                    <div>Duration: {bookingDetails.duration} minutes</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Team Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={court?.maxPlayersPerTeam || 11}
                      value={bookingDetails.teamSize}
                      onChange={(e) => setBookingDetails(prev => ({
                        ...prev,
                        teamSize: parseInt(e.target.value)
                      }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Duration (minutes)
                    </label>
                    <select
                      value={bookingDetails.duration}
                      onChange={(e) => setBookingDetails(prev => ({
                        ...prev,
                        duration: parseInt(e.target.value)
                      }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value={60} className="bg-gray-900">60 minutes</option>
                      <option value={90} className="bg-gray-900">90 minutes</option>
                      <option value={120} className="bg-gray-900">120 minutes</option>
                      <option value={180} className="bg-gray-900">180 minutes</option>
                    </select>
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
                          {selectedSlot.startTime} - {calculateEndTime(selectedSlot.startTime, bookingDetails.duration)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users size={16} className="text-blue-400 mr-2" />
                        <span className="text-white/80">
                          {bookingDetails.teamSize} players
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Duration:</span>
                        <span className="text-white">{bookingDetails.duration} minutes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Rate:</span>
                        <span className="text-white">${selectedSlot.pricePerHour}/hour</span>
                      </div>
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span className="text-white">Total:</span>
                        <span className="text-green-400">${calculateTotalPrice()}</span>
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
                (bookingStep === 'details' && !bookingDetails.teamSize)
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
    </AnimatePresence>
  );
};

export default BookingCalendar;
