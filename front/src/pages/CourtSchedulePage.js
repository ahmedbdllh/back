import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  Calendar,
  Users,
  AlertCircle,
  Settings,
  MapPin
} from 'lucide-react';
import CourtScheduleManager from '../features/booking/components/CourtScheduleManager';
import { getCourtsByCompany } from '../features/court/services/courtService';
import { getCompaniesByManager } from '../features/court/services/companyService';

function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    return null;
  }
}

const CourtSchedulePage = () => {
  const [loading, setLoading] = useState(true);
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchManagerCourts();
  }, []);

  const fetchManagerCourts = async () => {
    try {
      setLoading(true);
      
      // Get current user from token (same as working court management)
      const currentUser = getCurrentUser();
      if (!currentUser?.id) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      console.log('Current user ID:', currentUser.id);

      // Get companies owned by this manager (same as working court management)
      const companiesResponse = await getCompaniesByManager(currentUser.id);
      
      if (!companiesResponse.data || companiesResponse.data.length === 0) {
        setError('No companies found for your account. Please contact an administrator.');
        return;
      }

      console.log('Companies found:', companiesResponse.data);

      // Get courts from all companies owned by this manager
      let allCourts = [];
      for (const company of companiesResponse.data) {
        try {
          const courtsResponse = await getCourtsByCompany(company._id);
          if (courtsResponse && courtsResponse.data) {
            allCourts = [...allCourts, ...courtsResponse.data];
          }
        } catch (err) {
          console.error(`Failed to fetch courts for company ${company._id}:`, err);
        }
      }

      console.log('All courts found:', allCourts);
      setCourts(allCourts);
      setError(null);
    } catch (err) {
      console.error('Courts fetch error:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Failed to load your courts';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied. You may not have permission to view these courts.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to court service. Please ensure all services are running.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleUpdate = (courtId, updatedSchedule) => {
    setCourts(prev => prev.map(court => 
      court._id === courtId 
        ? { ...court, schedule: updatedSchedule }
        : court
    ));
    setShowScheduleManager(false);
    setSelectedCourt(null);
  };

  const openScheduleManager = (court) => {
    setSelectedCourt(court);
    setShowScheduleManager(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
          <AlertCircle size={20} className="text-red-400 mr-2" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

        {/* Courts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map((court, index) => (
            <div
              key={court._id}
              className="relative group"
            >
              <div className="relative p-3 sm:p-4 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl transition-all duration-300 group-hover:border-white/30 group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                {/* Court Image */}
                <div className="relative w-full h-32 sm:h-40 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl mb-3 overflow-hidden group-hover:shadow-lg transition-shadow duration-300">
                  {court.image ? (
                    <img 
                      src={court.image && court.image.startsWith('/uploads') ? `http://localhost:5003${court.image}` : court.image} 
                      alt={court.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                      <div className="text-center text-white/50">
                        <svg 
                          className="w-8 h-8 mx-auto mb-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs">No image</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Court Info */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-white flex-1 min-w-0 truncate">{court.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      court.type === 'football' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {court.type}
                    </span>
                  </div>

                  {court.location?.address && (
                    <div className="flex items-center gap-1 text-white/60 text-xs">
                      <MapPin size={10} className="flex-shrink-0" />
                      <span className="truncate">{court.location.address}</span>
                    </div>
                  )}

                  {court.location?.city && (
                    <div className="flex items-center gap-1 text-white/50 text-xs">
                      <MapPin size={10} className="flex-shrink-0" />
                      <span className="truncate">{court.location.city}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1 text-white/60">
                      <Users size={10} className="flex-shrink-0" />
                      <span className="whitespace-nowrap">{court.maxPlayersPerTeam} per team</span>
                    </div>
                    {court.matchTime && (
                      <div className="flex items-center gap-1 text-white/60">
                        <Clock size={10} className="flex-shrink-0" />
                        <span className="whitespace-nowrap">{court.matchTime}min</span>
                      </div>
                    )}
                  </div>

                  {court.description && (
                    <p className="text-white/50 text-xs line-clamp-1">{court.description}</p>
                  )}

                  {court.amenities && court.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {court.amenities.slice(0, 2).map((amenity, i) => (
                        <span key={i} className="px-1 py-0.5 bg-sky-500/20 text-sky-300 text-xs rounded-md">
                          {amenity}
                        </span>
                      ))}
                      {court.amenities.length > 2 && (
                        <span className="px-1 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-md">
                          +{court.amenities.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Schedule Info */}
                  <div className="mb-2 space-y-1">
                    <div className="flex items-center text-white/70 text-xs">
                      <Clock size={10} className="mr-1 text-blue-400" />
                      <span>
                        {court.schedule?.workingHours?.start || '09:00'} - {court.schedule?.workingHours?.end || '22:00'}
                      </span>
                    </div>
                    <div className="flex items-center text-white/70 text-xs">
                      <Calendar size={10} className="mr-1 text-green-400" />
                      <span>
                        {court.schedule?.workingDays?.length || 7} days/week
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => openScheduleManager(court)}
                    style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
                    className="w-full flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mt-2"
                  >
                    <Settings size={12} className="mr-1" />
                    Manage Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {courts.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-white/40 mb-4">
              <Calendar size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Courts Found</h3>
            <p className="text-white/60 mb-6">
              {error ? 'Unable to load courts for your company' : 'No courts are associated with your company'}
            </p>
          </div>
        )}

        {/* Schedule Manager Modal */}
        <CourtScheduleManager
          court={selectedCourt}
          isOpen={showScheduleManager}
          onClose={() => {
            setShowScheduleManager(false);
            setSelectedCourt(null);
          }}
          onSave={(updatedSchedule) => handleScheduleUpdate(selectedCourt?._id, updatedSchedule)}
        />
    </div>
  );
};

export default CourtSchedulePage;
