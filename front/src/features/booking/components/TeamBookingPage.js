import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { scheduleService } from '../services/scheduleService';
import { courtService } from '../../court/services/courtService';
import { teamService } from '../../teams/services/teamService';
import { teamBookingService } from '../services/teamBookingService';

const TeamBookingPage = () => {
  const { user, token } = useAuth();
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingData, setBookingData] = useState({
    startTime: '',
    duration: 60,
    notes: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedCourt, selectedDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load user's team
      const teamData = await teamService.getMyTeam(token);
      if (!teamData || !teamData.captain || teamData.captain._id !== user.id) {
        setError('You must be a team captain to make team bookings.');
        return;
      }
      setUserTeam(teamData);

      // Load available courts
      const courtsData = await courtService.getAllCourts();
      setCourts(courtsData || []);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load booking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const data = await teamBookingService.getAvailableSlots(selectedCourt, selectedDate, token);
      setAvailableSlots(data.availableSlots || []);
    } catch (err) {
      console.error('Error loading slots:', err);
      setError('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!selectedCourt || !selectedDate || !bookingData.startTime || !userTeam) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const data = await teamBookingService.createTeamBooking({
        courtId: selectedCourt,
        teamId: userTeam._id,
        date: selectedDate,
        startTime: bookingData.startTime,
        duration: bookingData.duration,
        notes: bookingData.notes
      }, token);
      
      if (data.success) {
        setSuccess(`Team booking created successfully! Booking ID: ${data.booking.id}`);
        setBookingData({ startTime: '', duration: 60, notes: '' });
        loadAvailableSlots(); // Refresh available slots
      } else {
        setError(data.message || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCourtName = () => {
    const court = courts.find(c => c._id === selectedCourt);
    return court ? court.name : 'Select a court';
  };

  const getDurationPrice = (duration) => {
    const slot = availableSlots.find(s => s.time === bookingData.startTime);
    if (slot) {
      const durationOption = slot.availableDurations.find(d => d.duration === duration);
      return durationOption ? durationOption.price : 0;
    }
    return 0;
  };

  if (loading && !userTeam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Team Court Booking
            </h1>
            {userTeam && (
              <p className="mt-2 text-sm text-gray-600">
                Booking for team: <span className="font-medium">{userTeam.name}</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Captain</span>
              </p>
            )}
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">{success}</div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-6">
              {/* Court Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Court *
                </label>
                <select
                  value={selectedCourt || ''}
                  onChange={(e) => setSelectedCourt(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a court...</option>
                  {courts.map(court => (
                    <option key={court._id} value={court._id}>
                      {court.name} - {court.type} ({court.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Time Slot Selection */}
              {availableSlots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Available Time Slots *
                  </label>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setBookingData(prev => ({ ...prev, startTime: slot.time }))}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          bookingData.startTime === slot.time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration Selection */}
              {bookingData.startTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Duration *
                  </label>
                  <div className="mt-2 space-y-2">
                    {availableSlots
                      .find(s => s.time === bookingData.startTime)
                      ?.availableDurations.map(duration => (
                        <label key={duration.duration} className="flex items-center">
                          <input
                            type="radio"
                            name="duration"
                            value={duration.duration}
                            checked={bookingData.duration === duration.duration}
                            onChange={(e) => setBookingData(prev => ({ 
                              ...prev, 
                              duration: parseInt(e.target.value) 
                            }))}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                          />
                          <span className="ml-3 text-sm">
                            {duration.durationLabel} - {duration.priceLabel}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special requests or notes for this booking..."
                />
              </div>

              {/* Booking Summary */}
              {selectedCourt && selectedDate && bookingData.startTime && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Team:</span>
                      <span className="font-medium">{userTeam?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Court:</span>
                      <span className="font-medium">{getSelectedCourtName()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{bookingData.startTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{bookingData.duration} minutes</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-gray-900 font-medium">Total Price:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {getDurationPrice(bookingData.duration)} DT
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !selectedCourt || !selectedDate || !bookingData.startTime}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Booking...' : 'Create Team Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamBookingPage;
