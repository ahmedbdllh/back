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
import { scheduleService } from '../services/scheduleService';

const CourtScheduleManager = ({ court, isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [schedule, setSchedule] = useState({
    workingHours: {
      monday: { isOpen: true, start: '08:00', end: '22:00' },
      tuesday: { isOpen: true, start: '08:00', end: '22:00' },
      wednesday: { isOpen: true, start: '08:00', end: '22:00' },
      thursday: { isOpen: true, start: '08:00', end: '22:00' },
      friday: { isOpen: true, start: '08:00', end: '22:00' },
      saturday: { isOpen: true, start: '08:00', end: '22:00' },
      sunday: { isOpen: true, start: '08:00', end: '22:00' }
    },
    pricing: {
      pricePerHour: 15, // Price per hour in dinars
      advanceBookingPrice: 200, // Price for advance booking in dinars
      availableMatchDurations: [60, 90, 120], // Available match durations in minutes
      defaultMatchDuration: 90 // Default match duration (1.5 hours)
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
      fetchSchedule();
    }
  }, [isOpen, court]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await scheduleService.getCourtSchedule(court._id);
      if (response.success && response.data.schedule) {
        setSchedule({ ...schedule, ...response.data.schedule });
      }
      setError(null);
    } catch (err) {
      setError('Failed to load court schedule');
      console.error('Schedule fetch error:', err);
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

  const addMatchDuration = (duration) => {
    setSchedule(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        availableMatchDurations: [...prev.pricing.availableMatchDurations, duration].sort((a, b) => a - b)
      }
    }));
  };

  const removeMatchDuration = (duration) => {
    setSchedule(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        availableMatchDurations: prev.pricing.availableMatchDurations.filter(d => d !== duration)
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
      const response = await scheduleService.updateCourtSchedule(court._id, schedule);
      
      if (response.success) {
        setSuccess('Court schedule updated successfully');
        onSave && onSave(response.data.schedule);
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
                          <input
                            type="time"
                            value={schedule.workingHours[day].start}
                            onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                          <span className="text-white/60 py-2">to</span>
                          <input
                            type="time"
                            value={schedule.workingHours[day].end}
                            onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
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
                      Price per Hour (Dinars)
                    </label>
                    <input
                      type="number"
                      value={schedule.pricing.pricePerHour}
                      onChange={(e) => handlePricingChange('pricePerHour', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="15"
                    />
                    <p className="text-white/60 text-xs mt-1">Base price per hour for court booking</p>
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

                {/* Match Duration Settings */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-white">Available Match Durations</h4>
                    <select
                      value=""
                      onChange={(e) => {
                        const duration = parseInt(e.target.value);
                        if (duration && !schedule.pricing.availableMatchDurations.includes(duration)) {
                          addMatchDuration(duration);
                        }
                      }}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="" className="bg-gray-900">Add Duration</option>
                      <option value={30} className="bg-gray-900">30 minutes</option>
                      <option value={60} className="bg-gray-900">1 hour</option>
                      <option value={90} className="bg-gray-900">1.5 hours</option>
                      <option value={120} className="bg-gray-900">2 hours</option>
                      <option value={150} className="bg-gray-900">2.5 hours</option>
                      <option value={180} className="bg-gray-900">3 hours</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {schedule.pricing.availableMatchDurations.map((duration) => {
                        const hours = duration / 60;
                        const price = (schedule.pricing.pricePerHour * hours).toFixed(1);
                        return (
                          <div key={duration} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                            <div className="text-white">
                              <div className="font-medium">{hours}h</div>
                              <div className="text-xs text-white/60">{price} DT</div>
                            </div>
                            <button
                              onClick={() => removeMatchDuration(duration)}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-white mb-2">
                      Default Match Duration
                    </label>
                    <select
                      value={schedule.pricing.defaultMatchDuration}
                      onChange={(e) => handlePricingChange('defaultMatchDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {schedule.pricing.availableMatchDurations.map((duration) => (
                        <option key={duration} value={duration} className="bg-gray-900">
                          {duration / 60}h ({(schedule.pricing.pricePerHour * duration / 60).toFixed(1)} DT)
                        </option>
                      ))}
                    </select>
                  </div>
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
