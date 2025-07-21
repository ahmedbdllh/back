import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader,
  Filter,
  Search,
  Eye,
  X
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { Container } from '../../../shared/ui/components/Container';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(filters.status !== 'all' && { status: filters.status })
      };
      
      const response = await bookingService.getBookings(params);
      setBookings(response.bookings);
      setTotalPages(response.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to load bookings');
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId, reason) => {
    try {
      setActionLoading(true);
      await bookingService.cancelBooking(bookingId, reason);
      fetchBookings(); // Refresh the list
      setShowDetails(false);
    } catch (err) {
      setError('Failed to cancel booking');
      console.error('Cancel booking error:', err);
    } finally {
      setActionLoading(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canCancelBooking = (booking) => {
    if (booking.status !== 'pending' && booking.status !== 'confirmed') return false;
    
    const bookingDateTime = new Date(`${booking.date} ${booking.startTime}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);
    
    return hoursUntilBooking >= 24; // Can cancel if more than 24 hours away
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
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-12">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              My Bookings
            </h1>
            <p className="text-xl text-white/80">
              Manage your court reservations and upcoming games
            </p>
          </motion.div>
        </Container>
      </div>

      <Container className="py-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Search bookings..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all" className="bg-gray-900">All Bookings</option>
              <option value="pending" className="bg-gray-900">Pending</option>
              <option value="confirmed" className="bg-gray-900">Confirmed</option>
              <option value="completed" className="bg-gray-900">Completed</option>
              <option value="cancelled" className="bg-gray-900">Cancelled</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" size={16} />
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
            <AlertCircle size={20} className="text-red-400 mr-3" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Bookings List */}
        <AnimatePresence mode="wait">
          {bookings.length === 0 ? (
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
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{booking.courtDetails.name}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-white/80">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2 text-blue-400" />
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={16} className="mr-2 text-blue-400" />
                          <span>{booking.startTime} - {booking.endTime}</span>
                        </div>
                        <div className="flex items-center">
                          <Users size={16} className="mr-2 text-blue-400" />
                          <span>{booking.teamSize} players</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin size={16} className="mr-2 text-blue-400" />
                          <span>{booking.courtDetails.city}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end mt-3">
                        <span className="text-sm text-white/60">
                          {booking.duration} minutes
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetails(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Eye size={16} className="mr-2" />
                        Details
                      </button>
                      
                      {canCancelBooking(booking) && (
                        <button
                          onClick={() => handleCancelBooking(booking._id, 'Cancelled by user')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading ? <Loader size={16} className="animate-spin" /> : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </Container>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {showDetails && selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Booking Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Court Information</h3>
                      <div className="space-y-2 text-white/80">
                        <p><strong>Name:</strong> {selectedBooking.courtDetails.name}</p>
                        <p><strong>Type:</strong> {selectedBooking.courtDetails.type}</p>
                        <p><strong>Address:</strong> {selectedBooking.courtDetails.address}</p>
                        <p><strong>City:</strong> {selectedBooking.courtDetails.city}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Company</h3>
                      <div className="space-y-2 text-white/80">
                        <p><strong>Name:</strong> {selectedBooking.companyDetails.companyName}</p>
                        <p><strong>Manager:</strong> {selectedBooking.companyDetails.managerName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Booking Details</h3>
                      <div className="space-y-2 text-white/80">
                        <p><strong>Date:</strong> {formatDate(selectedBooking.date)}</p>
                        <p><strong>Time:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}</p>
                        <p><strong>Duration:</strong> {selectedBooking.duration} minutes</p>
                        <p><strong>Team Size:</strong> {selectedBooking.teamSize} players</p>
                        <div className="flex items-center">
                          <strong className="mr-2">Status:</strong>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(selectedBooking.status)}
                            <span className="capitalize">{selectedBooking.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Payment</h3>
                      <div className="space-y-2 text-white/80">
                        <p><strong>Payment Status:</strong> {selectedBooking.paymentStatus}</p>
                        <p><strong>Payment Method:</strong> {selectedBooking.paymentMethod}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedBooking.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
                    <p className="text-white/80 bg-white/5 p-3 rounded-lg">{selectedBooking.notes}</p>
                  </div>
                )}
                
                {selectedBooking.cancellationReason && (
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Cancellation Reason</h3>
                    <p className="text-red-300 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      {selectedBooking.cancellationReason}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
                {canCancelBooking(selectedBooking) && (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking._id, 'Cancelled by user')}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {actionLoading ? <Loader size={16} className="animate-spin mr-2" /> : null}
                    Cancel Booking
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyBookingsPage;
