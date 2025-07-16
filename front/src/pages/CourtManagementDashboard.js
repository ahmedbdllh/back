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
import { getCourtsByCompany, getCourts } from '../features/court/services/courtService';
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
      // Get current user's company ID from localStorage or context
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = user.companyId;
      
      let response;
      if (companyId) {
        response = await getCourtsByCompany(companyId);
      } else {
        response = await getCourts();
      }
      
      if (response && response.data) {
        setCourts(response.data || []);
        // Fetch statistics for each court
        await fetchCourtStatistics(response.data || []);
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
          <h1 className="text-3xl font-bold text-white mb-2">Court Management</h1>
          <p className="text-white/60">Manage your courts, schedules, and monitor performance</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
            <AlertCircle size={20} className="text-red-400 mr-2" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Courts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {courts.map((court) => {
            const courtStats = statistics[court._id] || {};
            
            return (
              <motion.div
                key={court._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
              >
                {/* Court Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-700">
                  {court.images && court.images.length > 0 ? (
                    <img
                      src={court.images[0]}
                      alt={court.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white/60 text-center">
                        <Users size={48} className="mx-auto mb-2" />
                        <p className="text-sm">No image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      court.status === 'active' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {court.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Court Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{court.name}</h3>
                  <p className="text-white/60 text-sm mb-4">{court.description}</p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Calendar size={16} className="text-blue-400 mr-1" />
                        <span className="text-2xl font-bold text-white">
                          {courtStats.totalBookings || 0}
                        </span>
                      </div>
                      <p className="text-white/60 text-xs">Bookings (30d)</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign size={16} className="text-green-400 mr-1" />
                        <span className="text-2xl font-bold text-white">
                          {formatCurrency(courtStats.revenue)}
                        </span>
                      </div>
                      <p className="text-white/60 text-xs">Revenue (30d)</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp size={16} className="text-purple-400 mr-1" />
                        <span className="text-2xl font-bold text-white">
                          {formatPercentage(courtStats.occupancyRate)}
                        </span>
                      </div>
                      <p className="text-white/60 text-xs">Occupancy</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Clock size={16} className="text-orange-400 mr-1" />
                        <span className="text-2xl font-bold text-white">
                          {Math.round(courtStats.averageBookingDuration || 0)}
                        </span>
                      </div>
                      <p className="text-white/60 text-xs">Avg Duration (min)</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Edit size={16} className="mr-2 inline" />
                      Edit Court
                    </button>
                    
                    <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                      <Eye size={16} />
                    </button>
                    
                    <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                      <BarChart3 size={16} />
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
            <p className="text-white/60 mb-6">Create your first court to start managing bookings</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add New Court
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourtManagementDashboard;
