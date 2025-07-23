import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  DollarSign,
  Settings, 
  Save,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { updateCourt } from '../../court/services/courtService';

const CourtScheduleManager = ({ court, isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [schedule, setSchedule] = useState({
    workingHours: {
      monday: { isOpen: true, start: '08:00 AM', end: '10:00 PM' },
      tuesday: { isOpen: true, start: '08:00 AM', end: '10:00 PM' },
      wednesday: { isOpen: true, start: '08:00 AM', end: '10:00 PM' },
      thursday: { isOpen: true, start: '08:00 AM', end: '10:00 PM' },
      friday: { isOpen: true, start: '08:00 AM', end: '10:00 PM' },
      saturday: { isOpen: true, start: '08:00 AM', end: '10:00 PM' },
      sunday: { isOpen: true, start: '08:00 AM', end: '10:00 PM' }
    },
    pricing: {
      pricePerMatch: 15, // Price per match in dinars
      advanceBookingPrice: 200, // Price for advance booking in dinars
      matchDuration: 90 // Match duration from court settings (1.5 hours)
    },
    advanceBookingDays: 30,
    cancellationPolicy: {
      allowCancellation: true,
      cancellationDeadlineHours: 24,
      refundPercentage: 80
    },
    blockedDates: []
  });

  const [newBlockedDate, setNewBlockedDate] = useState({
    date: '',
    reason: '',
    isRecurring: false
  });

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (isOpen && court) {
      initializeSchedule();
    }
  }, [isOpen, court]);

  // Helper function to convert 24-hour to 12-hour format
  const convertTo12Hour = (time24) => {
    if (!time24) return '08:00 AM';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  // Helper function to convert 12-hour to 24-hour format
  const convertTo24Hour = (time12) => {
    if (!time12) return '08:00';
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  // Generate time options in 12-hour format
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const time12 = convertTo12Hour(time24);
        times.push(time12);
      }
    }
    return times;
  };

  const initializeSchedule = () => {
    try {
      setLoading(true);
      
      // Check if court has saved schedule data
      const savedSchedule = court?.schedule;
      
      let initialSchedule;
      
      if (savedSchedule && savedSchedule.workingHours) {
        // Use saved schedule with 12-hour format conversion
        initialSchedule = {
          workingHours: Object.keys(savedSchedule.workingHours).reduce((acc, day) => {
            const daySchedule = savedSchedule.workingHours[day];
            acc[day] = {
              isOpen: daySchedule.isOpen,
              start: convertTo12Hour(daySchedule.start),
              end: convertTo12Hour(daySchedule.end)
            };
            return acc;
          }, {}),
          pricing: {
            pricePerMatch: savedSchedule.pricing?.pricePerMatch || court.pricePerHour || 15,
            advanceBookingPrice: savedSchedule.pricing?.advanceBookingPrice || 200,
            matchDuration: savedSchedule.pricing?.matchDuration || court.matchTime || 90
          },
          advanceBookingDays: savedSchedule.advanceBookingDays || 30,
          cancellationPolicy: savedSchedule.cancellationPolicy || {
            allowCancellation: true,
            cancellationDeadlineHours: 24,
            refundPercentage: 80
          },
          blockedDates: savedSchedule.blockedDates || []
        };
      } else {
        // Initialize with court's basic data or defaults
        const defaultStart = convertTo12Hour(court.openingTime || '08:00');
        const defaultEnd = convertTo12Hour(court.closingTime || '22:00');
        
        initialSchedule = {
          workingHours: {
            monday: { isOpen: true, start: defaultStart, end: defaultEnd },
            tuesday: { isOpen: true, start: defaultStart, end: defaultEnd },
            wednesday: { isOpen: true, start: defaultStart, end: defaultEnd },
            thursday: { isOpen: true, start: defaultStart, end: defaultEnd },
            friday: { isOpen: true, start: defaultStart, end: defaultEnd },
            saturday: { isOpen: true, start: defaultStart, end: defaultEnd },
            sunday: { isOpen: true, start: defaultStart, end: defaultEnd }
          },
          pricing: {
            pricePerMatch: court.pricePerHour || 15,
            advanceBookingPrice: 200,
            matchDuration: court.matchTime || 90
          },
          advanceBookingDays: 30,
          cancellationPolicy: {
            allowCancellation: true,
            cancellationDeadlineHours: 24,
            refundPercentage: 80
          },
          blockedDates: []
        };
      }
      
      setSchedule(initialSchedule);
      setError(null);
    } catch (err) {
      setError('Failed to initialize court schedule');
      console.error('Schedule initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handlePricingChange = (field, value) => {
    setSchedule(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }));
  };

  const addBlockedDate = () => {
    if (newBlockedDate.date && newBlockedDate.reason) {
      setSchedule(prev => ({
        ...prev,
        blockedDates: [
          ...prev.blockedDates,
          { ...newBlockedDate, date: new Date(newBlockedDate.date) }
        ]
      }));
      setNewBlockedDate({ date: '', reason: '', isRecurring: false });
    }
  };

  const removeBlockedDate = (index) => {
    setSchedule(prev => ({
      ...prev,
      blockedDates: prev.blockedDates.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Convert 12-hour format back to 24-hour format for saving
      const scheduleData = {
        workingHours: Object.keys(schedule.workingHours).reduce((acc, day) => {
          acc[day] = {
            ...schedule.workingHours[day],
            start: convertTo24Hour(schedule.workingHours[day].start),
            end: convertTo24Hour(schedule.workingHours[day].end)
          };
          return acc;
        }, {}),
        pricing: schedule.pricing,
        advanceBookingDays: schedule.advanceBookingDays,
        cancellationPolicy: schedule.cancellationPolicy,
        blockedDates: schedule.blockedDates
      };

      const updatedCourtData = {
        pricePerHour: schedule.pricing.pricePerMatch,
        openingTime: convertTo24Hour(schedule.workingHours.monday.start), // Keep for backward compatibility
        closingTime: convertTo24Hour(schedule.workingHours.monday.end), // Keep for backward compatibility
        schedule: scheduleData // Save the complete schedule
      };
      
      const response = await updateCourt(court._id, updatedCourtData);
      
      if (response && response.data) {
        setSuccess('Court schedule updated successfully');
        onSave && onSave(response.data);
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update schedule');
      console.error('Save schedule error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
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
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Manage Court Schedule</h2>
              <p className="text-white/60 mt-1">{court?.name} - Configure working hours and settings</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-8">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
              <AlertCircle size={20} className="text-red-400 mr-2" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center">
              <CheckCircle size={20} className="text-green-400 mr-2" />
              <span className="text-green-300">{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Working Hours */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Clock size={24} className="mr-2 text-blue-400" />
                  Working Hours
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {daysOfWeek.map((day, index) => (
                    <div key={day} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">{dayLabels[index]}</span>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={schedule.workingHours[day].isOpen}
                            onChange={(e) => handleWorkingHoursChange(day, 'isOpen', e.target.checked)}
                            className="mr-2 rounded"
                          />
                          <span className="text-white/80 text-sm">Open</span>
                        </label>
                      </div>
                      {schedule.workingHours[day].isOpen && (
                        <div className="flex space-x-2">
                          <select
                            value={schedule.workingHours[day].start}
                            onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            {generateTimeOptions().map(time => (
                              <option key={time} value={time} className="bg-gray-900">{time}</option>
                            ))}
                          </select>
                          <span className="text-white/60 py-2">to</span>
                          <select
                            value={schedule.workingHours[day].end}
                            onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            {generateTimeOptions().map(time => (
                              <option key={time} value={time} className="bg-gray-900">{time}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription Booking */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Settings size={24} className="mr-2 text-purple-400" />
                  Subscription Booking
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <label className="block text-sm font-medium text-white mb-2">
                      Advance Booking Days
                    </label>
                    <input
                      type="number"
                      value={schedule.advanceBookingDays}
                      onChange={(e) => setSchedule(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Configuration */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <DollarSign size={24} className="mr-2 text-green-400" />
                  Pricing Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <label className="block text-sm font-medium text-white mb-2">
                      Price per Match (Dinars)
                    </label>
                    <input
                      type="number"
                      value={schedule.pricing.pricePerMatch}
                      onChange={(e) => handlePricingChange('pricePerMatch', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="15"
                    />
                    <p className="text-white/60 text-xs mt-1">Fixed price per person regardless of duration</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <label className="block text-sm font-medium text-white mb-2">
                      Advance Booking Price (Dinars)
                    </label>
                    <input
                      type="number"
                      value={schedule.pricing.advanceBookingPrice}
                      onChange={(e) => handlePricingChange('advanceBookingPrice', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="200"
                    />
                    <p className="text-white/60 text-xs mt-1">Price for booking {schedule.advanceBookingDays} days in advance</p>
                  </div>
                </div>

                {/* Match Duration Display */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-4">Match Duration</h4>
                  
                  <div className="flex items-center justify-between bg-white/10 rounded-lg p-4">
                    <div className="text-white">
                      <div className="text-lg font-semibold">
                        {schedule.pricing.matchDuration / 60}h ({schedule.pricing.matchDuration} minutes)
                      </div>
                      <div className="text-sm text-white/60 mt-1">
                        Price: {schedule.pricing.pricePerMatch} DT per match
                      </div>
                    </div>
                    <div className="text-white/40 text-sm">
                      Set by court configuration
                    </div>
                  </div>
                  <p className="text-white/60 text-xs mt-2">
                    Match duration is configured in the court settings and cannot be changed here.
                  </p>
                </div>
              </div>

              {/* Blocked Dates */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Calendar size={24} className="mr-2 text-red-400" />
                  Blocked Dates
                </h3>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="date"
                      value={newBlockedDate.date}
                      onChange={(e) => setNewBlockedDate(prev => ({ ...prev, date: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <input
                      type="text"
                      placeholder="Reason (e.g., Maintenance)"
                      value={newBlockedDate.reason}
                      onChange={(e) => setNewBlockedDate(prev => ({ ...prev, reason: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                      onClick={addBlockedDate}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Block Date
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {schedule.blockedDates.map((blocked, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <div>
                          <span className="text-white">{new Date(blocked.date).toLocaleDateString()}</span>
                          <span className="text-white/60 ml-2">- {blocked.reason}</span>
                        </div>
                        <button
                          onClick={() => removeBlockedDate(index)}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center order-1 sm:order-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CourtScheduleManager;