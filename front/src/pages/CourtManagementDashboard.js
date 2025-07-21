import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  BarChart3,
  Calendar,
  Users,
  DollarSign,
  Edit,
  Eye,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { getCourtsByCompany, getCourts, getCourtsByUser } from '../features/court/services/courtService';
import { scheduleService } from '../features/booking/services/scheduleService';

const CourtManagementDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [courts, setCourts] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('User from localStorage:', user);
      
      // Get courts by user ID first
      const userId = user._id || user.id;
      console.log('User ID found:', userId);
      
      if (userId) {
        // Get courts by the user's ID
        const response = await getCourtsByUser(userId);
        if (response && response.data) {
          setCourts(response.data || []);
          await fetchCourtStatistics(response.data || []);
        }
      } else {
        // Fallback to get all courts if no user ID
        const response = await getCourts();
        if (response && response.data) {
          setCourts(response.data || []);
          await fetchCourtStatistics(response.data || []);
        }
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load courts');
      console.error('Courts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourtStatistics = async (courtList) => {
    const stats = {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    for (const court of courtList) {
      try {
        const response = await scheduleService.getScheduleStatistics(
          court._id,
          startDate.toISOString(),
          endDate.toISOString()
        );
        stats[court._id] = response.data;
      } catch (err) {
        console.error(`Failed to fetch stats for court ${court._id}:`, err);
        stats[court._id] = {
          totalBookings: 0,
          revenue: 0,
          occupancyRate: 0,
          averageBookingDuration: 0
        };
      }
    }
    setStatistics(stats);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const handleEditCourt = (court) => {
    // TODO: Open court configuration modal
    console.log('Edit court:', court);
    // This will open a modal to configure:
    // - Price per hour
    // - Opening/closing times
    // - Match duration
    // - Court details
  };

  const handleViewSchedule = (court) => {
    // TODO: Navigate to court schedule page
    console.log('View schedule for court:', court);
    // This will show the court's booking schedule
    // with time slots based on opening/closing hours
  };

  const handleViewStats = (court) => {
    // TODO: Open court statistics modal
    console.log('View stats for court:', court);
    // This will show detailed analytics for the court
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Courts</h1>
          <p className="text-white/60">Manage your courts, configure pricing, schedules, and operating hours</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
            <AlertCircle size={20} className="text-red-400 mr-2" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Courts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courts.map((court) => {
            const courtStats = statistics[court._id] || {};
            
            return (
              <motion.div
                key={court._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Court Image */}
                <div className="relative h-40">
                  {court.images && court.images.length > 0 ? (
                    <img
                      src={court.images[0]}
                      alt={court.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                      <Users size={32} className="text-white/60" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      court.status === 'active' 
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {court.status || 'Active'}
                    </span>
                  </div>

                  {/* Court Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-blue-600/80 text-white rounded-lg text-xs font-medium capitalize">
                      {court.type}
                    </span>
                  </div>

                  {/* Match Duration Badge */}
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2 py-1 bg-black/60 rounded-lg text-white text-xs font-medium">
                      {court.matchTime || 90}min
                    </span>
                  </div>
                </div>

                {/* Court Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">{court.name}</h3>
                    <span className="text-xs text-white/60">ID: {court._id.slice(-6)}</span>
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-center text-white/60 mb-2">
                    <span className="text-sm">📍 {court.location?.address || 'Location not set'}</span>
                  </div>
                  
                  {/* City */}
                  <div className="text-white/60 text-sm mb-3">
                    {court.location?.city || 'City not set'}
                  </div>

                  {/* Court Configuration */}
                  <div className="space-y-2 mb-4">
                    {/* Pricing */}
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">Price/Hour:</span>
                      <span className="text-green-400 font-semibold">${court.pricePerHour || 'Not set'}</span>
                    </div>
                    
                    {/* Operating Hours */}
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">Hours:</span>
                      <span className="text-white/80 text-sm">
                        {court.openingTime || '08:00'} - {court.closingTime || '22:00'}
                      </span>
                    </div>
                    
                    {/* Team size */}
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">Team Size:</span>
                      <span className="text-white/80 text-sm">{court.maxPlayersPerTeam || 5} per team</span>
                    </div>
                  </div>

                  {/* Quick Stats Row */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-white font-bold">{courtStats.totalBookings || 0}</div>
                      <div className="text-white/60 text-xs">Bookings</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-white font-bold">{formatPercentage(courtStats.occupancyRate)}</div>
                      <div className="text-white/60 text-xs">Occupancy</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button 
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      onClick={() => handleEditCourt(court)}
                    >
                      <Edit size={14} className="mr-1 inline" />
                      Configure
                    </button>
                    
                    <button 
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      onClick={() => handleViewSchedule(court)}
                    >
                      <Calendar size={14} />
                    </button>
                    
                    <button 
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      onClick={() => handleViewStats(court)}
                    >
                      <BarChart3 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {courts.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-white/40 mb-4">
              <Users size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Courts Found</h3>
            <p className="text-white/60 mb-6">You haven't created any courts yet. Create your first court to start managing bookings.</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create New Court
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourtManagementDashboard;