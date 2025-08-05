import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { Container } from '../../../shared/ui/components/Container';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchBookings();
  }, [filters, pagination.currentPage]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: 10,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      };

      const response = await bookingService.getBookings(params);
      setBookings(response.bookings || []);
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages || 1,
        total: response.total || 0
      }));
      setError(null);
    } catch (err) {
      setError('Failed to load bookings');
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingService.cancelBooking(bookingId, 'Cancelled by user');
      fetchBookings(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'pending':
        return <AlertCircle className="text-yellow-400" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-400" size={20} />;
      case 'completed':
        return <CheckCircle className="text-blue-400" size={20} />;
      default:
        return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400 bg-green-400/10';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Container className="py-20">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold text-white mt-6">Loading Bookings...</h2>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              My Bookings
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Manage your court bookings and track upcoming games
            </p>
          </motion.div>
        </Container>
      </div>

      <Container className="py-12">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex flex-col sm:flex-row gap-4"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all" className="bg-gray-900">All Bookings</option>
            <option value="pending" className="bg-gray-900">Pending</option>
            <option value="confirmed" className="bg-gray-900">Confirmed</option>
            <option value="completed" className="bg-gray-900">Completed</option>
            <option value="cancelled" className="bg-gray-900">Cancelled</option>
          </select>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-white/70">
            {pagination.total} booking{pagination.total !== 1 ? 's' : ''} found
          </p>
        </motion.div>

        {/* Bookings List */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <AlertCircle size={64} className="mx-auto text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Bookings</h3>
              <p className="text-white/60 mb-4">{error}</p>
              <button 
                onClick={fetchBookings}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          ) : bookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Calendar size={64} className="mx-auto text-white/40 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Bookings Found</h3>
              <p className="text-white/60">You haven't made any bookings yet.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Booking Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">
                          {booking.courtDetails?.name}
                        </h3>
                        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-2 capitalize">{booking.status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center text-white/80">
                          <Calendar size={16} className="mr-2 text-blue-400" />
                          <span className="text-sm">{formatDate(booking.date)}</span>
                        </div>
                        
                        <div className="flex items-center text-white/80">
                          <Clock size={16} className="mr-2 text-blue-400" />
                          <span className="text-sm">{booking.startTime} - {booking.endTime}</span>
                        </div>

                        <div className="flex items-center text-white/80">
                          <MapPin size={16} className="mr-2 text-blue-400" />
                          <span className="text-sm">{booking.courtDetails?.city}</span>
                        </div>

                        <div className="flex items-center text-white/80">
                          <Users size={16} className="mr-2 text-blue-400" />
                          <span className="text-sm">{booking.teamSize} players</span>
                        </div>
                      </div>

                      {/* Company Info */}
                      <div className="flex items-center justify-end">
                        <div className="text-white/60 text-sm">
                          {booking.companyDetails?.companyName}
                        </div>
                      </div>

                      {/* Notes */}
                      {booking.notes && (
                        <div className="text-white/70 text-sm bg-white/5 rounded-lg p-3">
                          <span className="font-medium text-white/80">Notes: </span>
                          {booking.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[120px]">
                      {booking.status === 'pending' || booking.status === 'confirmed' ? (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      ) : null}
                      
                      <button
                        onClick={() => {
                          // Navigate to booking details (you can implement this)
                          console.log('View details for booking:', booking._id);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center mt-8"
          >
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-white">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
      </Container>
    </div>
  );
};

export default BookingsPage;
