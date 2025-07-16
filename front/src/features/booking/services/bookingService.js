import axios from 'axios';

const BOOKING_API_URL = process.env.REACT_APP_BOOKING_SERVICE_URL || 'http://localhost:5005/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Axios instance with auth header
const bookingApi = axios.create({
  baseURL: BOOKING_API_URL,
});

bookingApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Booking Services
export const bookingService = {
  // Get user bookings
  getBookings: async (params = {}) => {
    const response = await bookingApi.get('/bookings', { params });
    return response.data;
  },

  // Create new booking
  createBooking: async (bookingData) => {
    const response = await bookingApi.post('/bookings', bookingData);
    return response.data;
  },

  // Get booking details
  getBooking: async (bookingId) => {
    const response = await bookingApi.get(`/bookings/${bookingId}`);
    return response.data;
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status, cancellationReason) => {
    const response = await bookingApi.put(`/bookings/${bookingId}/status`, {
      status,
      cancellationReason
    });
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId, reason) => {
    const response = await bookingApi.delete(`/bookings/${bookingId}`, {
      data: { reason }
    });
    return response.data;
  },

  // Get company bookings
  getCompanyBookings: async (companyId, params = {}) => {
    const response = await bookingApi.get(`/bookings/company/${companyId}`, { params });
    return response.data;
  }
};

// Calendar Services
export const calendarService = {
  // Get court calendar
  getCourtCalendar: async (courtId, month, year) => {
    const response = await bookingApi.get(`/calendar/${courtId}`, {
      params: { month, year }
    });
    return response.data;
  },

  // Get available time slots
  getAvailableSlots: async (courtId, date) => {
    const response = await bookingApi.get(`/calendar/${courtId}/available-slots`, {
      params: { date }
    });
    return response.data;
  },

  // Get calendar configuration
  getCalendarConfig: async (courtId) => {
    const response = await bookingApi.get(`/calendar/${courtId}/config`);
    return response.data;
  },

  // Update calendar configuration
  updateCalendarConfig: async (courtId, config) => {
    const response = await bookingApi.post(`/calendar/${courtId}/config`, config);
    return response.data;
  },

  // Get company calendar bookings
  getCompanyCalendarBookings: async (companyId, params = {}) => {
    const response = await bookingApi.get(`/calendar/company/${companyId}/bookings`, { params });
    return response.data;
  }
};

export default {
  booking: bookingService,
  calendar: calendarService
};
