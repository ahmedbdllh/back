import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Settings,
  BarChart3
} from 'lucide-react';
import { calendarService, bookingService } from '../services/bookingService';
import { Container } from '../../../shared/ui/components/Container';

const CompanyBookingDashboard = ({ companyId }) => {
  const [bookings, setBookings] = useState({});
  const [summary, setSummary] = useState({});
  const [courts, setCourts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCourt, setSelectedCourt] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchBookingData();
    }
  }, [companyId, currentDate, selectedCourt]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const params = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        ...(selectedCourt !== 'all' && { courtId: selectedCourt })
      };
      
      const response = await calendarService.getCompanyCalendarBookings(companyId, params);
      setBookings(response.bookingsByDate || {});
      setSummary(response.summary || {});
      setCourts(response.courts || []);
      setError(null);
    } catch (err) {
      setError('Failed to load booking data');
      console.error('Fetch booking data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status, reason = '') => {
    try {
      setActionLoading(true);
      await bookingService.updateBookingStatus(bookingId, status, reason);
      fetchBookingData(); // Refresh data
    } catch (err) {
      setError('Failed to update booking status');
      console.error('Update booking status error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      const dateStr = current.toISOString().split('T')[0];
      const dayBookings = bookings[dateStr] || [];
      const isCurrentMonth = current.getMonth() === month;
      const isToday = current.toDateString() === new Date().toDateString();
      
      days.push({
        date: new Date(current),
        dateStr,
        isCurrentMonth,
        isToday,
        bookings: dayBookings,
        revenue: dayBookings.reduce((sum, b) => sum + (b.status === 'completed' ? b.totalPrice : 0), 0)
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Container className="py-20">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold text-white mt-6">Loading Dashboard...</h2>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-12">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Booking Dashboard
              </h1>
              <p className="text-xl text-white/80">
                Manage your court bookings and track performance
              </p>
            </div>
            
            <div className="mt-6 md:mt-0">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Settings size={20} className="mr-2" />
                Calendar Settings
              </button>
            </div>
          </motion.div>
        </Container>
      </div>

      <Container className="py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
            <AlertCircle size={20} className="text-red-400 mr-3" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-white">{summary.totalBookings || 0}</p>
              </div>
              <Calendar className="text-blue-400" size={32} />
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Confirmed</p>
                <p className="text-2xl font-bold text-green-400">{summary.confirmed || 0}</p>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{summary.pending || 0}</p>
              </div>
              <AlertCircle className="text-yellow-400" size={32} />
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Revenue</p>
                <p className="text-2xl font-bold text-green-400">${summary.totalRevenue || 0}</p>
              </div>
              <DollarSign className="text-green-400" size={32} />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
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
          
          <div className="relative">
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all" className="bg-gray-900">All Courts</option>
              {courts.map(court => (
                <option key={court._id} value={court._id} className="bg-gray-900">
                  {court.name}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" size={16} />
          </div>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-white/60">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((day, index) => (
              <div
                key={index}
                className={`
                  p-3 min-h-[100px] border border-white/10 rounded-lg
                  ${day.isCurrentMonth ? 'bg-white/5' : 'bg-white/5 opacity-50'}
                  ${day.isToday ? 'ring-2 ring-blue-400' : ''}
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-medium ${day.isCurrentMonth ? 'text-white' : 'text-white/40'}`}>
                    {day.date.getDate()}
                  </span>
                  {day.revenue > 0 && (
                    <span className="text-xs text-green-400">${day.revenue}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  {day.bookings.slice(0, 3).map((booking, bookingIndex) => (
                    <div
                      key={bookingIndex}
                      className={`text-xs p-1 rounded border ${getStatusColor(booking.status)}`}
                    >
                      <div className="truncate">{booking.courtDetails.name}</div>
                      <div>{booking.startTime}</div>
                    </div>
                  ))}
                  {day.bookings.length > 3 && (
                    <div className="text-xs text-white/60">+{day.bookings.length - 3} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Recent Bookings</h3>
          
          <div className="space-y-4">
            {Object.entries(bookings)
              .flatMap(([date, dayBookings]) => 
                dayBookings.map(booking => ({ ...booking, date }))
              )
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 10)
              .map((booking, index) => (
                <div
                  key={booking._id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-white/5 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-white">{booking.courtDetails.name}</h4>
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-white/80">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2 text-blue-400" />
                        <span>{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2 text-blue-400" />
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign size={14} className="mr-2 text-green-400" />
                        <span>${booking.totalPrice}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-white/60 mt-1">
                      Customer: {booking.userDetails.name} ({booking.userDetails.email})
                    </div>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed')}
                        disabled={actionLoading}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleUpdateBookingStatus(booking._id, 'cancelled', 'Cancelled by manager')}
                        disabled={actionLoading}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default CompanyBookingDashboard;
