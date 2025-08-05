import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { courtService } from '../../court/services/courtService';
import FullCalendarBooking from './FullCalendarBooking';
import DailyScheduleView from './DailyScheduleView';

const CourtBookingPage = () => {
  const { user, token } = useAuth();
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, calendar, schedule
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async () => {
    try {
      setLoading(true);
      const courtsData = await courtService.getAllCourts();
      setCourts(courtsData || []);
    } catch (err) {
      console.error('Error loading courts:', err);
      setError('Failed to load courts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourtSelect = (court, mode = 'calendar') => {
    setSelectedCourt(court);
    setViewMode(mode);
  };

  const handleSlotSelect = (slotData) => {
    console.log('Selected slot:', slotData);
    // Handle booking logic here
    alert(`Selected slot: ${slotData.startTime} - ${slotData.endTime} on ${slotData.date.toLocaleDateString()}`);
  };

  const renderCourtCard = (court) => (
    <div key={court._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{court.name}</h3>
            <p className="text-sm text-gray-600">{court.type} • {court.city}</p>
            {court.address && (
              <p className="text-sm text-gray-500 mt-1">📍 {court.address}</p>
            )}
          </div>
          {court.isActive && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>

        {court.description && (
          <p className="text-gray-700 mb-4">{court.description}</p>
        )}

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Features & Amenities</h4>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              🏓 Paddle Court
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              ⏰ 4:00 AM - 11:30 PM
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
              ⚡ 90-min Sessions
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
              🎯 13 Daily Slots
            </span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => handleCourtSelect(court, 'calendar')}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium"
          >
            📅 Monthly Calendar
          </button>
          <button
            onClick={() => handleCourtSelect(court, 'schedule')}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium"
          >
            📋 Daily Schedule
          </button>
        </div>
      </div>
    </div>
  );

  const renderScheduleHeader = () => (
    <div className="bg-blue-50 rounded-lg p-6 mb-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Full Schedule Available
        </h2>
        <p className="text-gray-600 mb-4">
          Book your paddle court sessions with our extended operating hours
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🌅</div>
            <div className="text-sm font-medium text-gray-900">Early Morning</div>
            <div className="text-xs text-gray-600">4:00 AM - 6:00 AM</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">☀️</div>
            <div className="text-sm font-medium text-gray-900">Daytime</div>
            <div className="text-xs text-gray-600">6:00 AM - 6:00 PM</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🌆</div>
            <div className="text-sm font-medium text-gray-900">Evening</div>
            <div className="text-xs text-gray-600">6:00 PM - 9:00 PM</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🌙</div>
            <div className="text-sm font-medium text-gray-900">Night</div>
            <div className="text-xs text-gray-600">9:00 PM - 11:30 PM</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (viewMode === 'calendar' && selectedCourt) {
    return (
      <FullCalendarBooking
        courtId={selectedCourt._id}
        courtName={selectedCourt.name}
        onClose={() => setViewMode('list')}
      />
    );
  }

  if (viewMode === 'schedule' && selectedCourt) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <DailyScheduleView
          courtId={selectedCourt._id}
          courtName={selectedCourt.name}
          selectedDate={selectedDate}
          onSlotSelect={handleSlotSelect}
          onClose={() => setViewMode('list')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Court Booking System
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Book your paddle court with our comprehensive scheduling system
          </p>
        </div>

        {renderScheduleHeader()}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading courts...</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Available Courts ({courts.length})
              </h2>
              <div className="text-sm text-gray-600">
                Operating Hours: 4:00 AM - 11:30 PM • 90-minute sessions
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map(renderCourtCard)}
            </div>

            {courts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏓</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courts available</h3>
                <p className="text-gray-600">
                  Courts will appear here once they are configured by the administrators.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourtBookingPage;
