import React, { useState, useEffect } from 'react';
import { Card } from '../../../shared/ui/components/Card';
import { ToastContainer, useToast } from '../../../shared/ui/components/Toast';
import Pagination from '../../../shared/ui/components/Pagination';

const BookingHistory = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toasts, success, error, removeToast } = useToast();

  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      success(message);
    } else {
      error(message);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch('http://localhost:5005/api/team-bookings/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        console.error('Failed to fetch booking history');
        showToast('Failed to load booking history', 'error');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Error loading booking history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      const response = await fetch(`http://localhost:5005/api/team-bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showToast('Booking cancelled successfully', 'success');
        // Update the booking status locally without refetching
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: 'cancelled' }
              : booking
          )
        );
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to cancel booking', 'error');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showToast('Error cancelling booking', 'error');
    }
  };

  const canCancelBooking = (bookingDate, bookingTime) => {
    try {
      const now = new Date();
      
      // Handle different date formats
      let bookingDateTime;
      if (bookingDate instanceof Date) {
        bookingDateTime = new Date(bookingDate);
      } else if (typeof bookingDate === 'string') {
        // Try parsing the date string
        bookingDateTime = new Date(bookingDate);
      } else {
        console.warn('Invalid booking date format:', bookingDate);
        return false;
      }
      
      // Add time if provided
      if (bookingTime && typeof bookingTime === 'string') {
        const timeStr = `${bookingDateTime.toISOString().split('T')[0]}T${bookingTime}`;
        bookingDateTime = new Date(timeStr);
      }
      
      // Check if the date is valid
      if (isNaN(bookingDateTime.getTime())) {
        console.warn('Invalid booking date/time:', { bookingDate, bookingTime });
        return false;
      }
      
      const timeDifference = bookingDateTime.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      
      console.log('🔍 Cancel check:', {
        bookingDate,
        bookingTime,
        now: now.toISOString(),
        bookingDateTime: bookingDateTime.toISOString(),
        hoursDifference,
        canCancel: hoursDifference >= 12
      });
      
      return hoursDifference >= 12;
    } catch (error) {
      console.error('Error in canCancelBooking:', error, { bookingDate, bookingTime });
      return false;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = bookings.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  if (loading) {
    return (
      <Card variant="glass">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card variant="glass">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Booking History</h3>
            <button
              onClick={fetchBookings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105"
            >
              Refresh
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">No bookings found</h4>
              <p className="text-gray-400">You haven't made any bookings yet.</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Court</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Company</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Team</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Price</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBookings.map((booking) => (
                      <tr 
                        key={booking._id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="text-white font-medium">
                            {booking.court?.name || booking.courtDetails?.name || 'Unknown Court'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-300">
                            {booking.companyDetails?.companyName || 'Unknown Company'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-300">
                            {formatDate(booking.date)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-300">
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-300">
                            {booking.team?.name || 'est'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-300">
                            15 TND per person
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-600/20 text-green-400' :
                            booking.status === 'cancelled' ? 'bg-red-600/20 text-red-400' :
                            'bg-yellow-600/20 text-yellow-400'
                          }`}>
                            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {booking.status !== 'cancelled' && canCancelBooking(booking.date, booking.startTime) && (
                            <button
                              onClick={() => cancelBooking(booking._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          
                          {booking.status !== 'cancelled' && !canCancelBooking(booking.date, booking.startTime) && (
                            <span className="text-xs text-gray-500">
                              Cannot Cancel
                            </span>
                          )}
                          
                          {booking.status === 'cancelled' && (
                            <span className="text-xs text-red-400">
                              Cancelled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {bookings.length > itemsPerPage && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    total={bookings.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default BookingHistory;
