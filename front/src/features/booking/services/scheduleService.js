import axios from 'axios';

const BOOKING_API_URL = process.env.REACT_APP_BOOKING_SERVICE_URL || 'http://localhost:5005/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Axios instance with auth header
const scheduleApi = axios.create({
  baseURL: BOOKING_API_URL,
});

scheduleApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class ScheduleService {
  constructor() {
    this.baseURL = '/calendar';
  }

  async getCourtSchedule(courtId) {
    try {
      const response = await scheduleApi.get(`${this.baseURL}/${courtId}/schedule`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get court schedule error:', error);
      throw error;
    }
  }

  async updateCourtSchedule(courtId, schedule) {
    try {
      const response = await scheduleApi.put(`${this.baseURL}/${courtId}/schedule`, {
        schedule
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update court schedule error:', error);
      throw error;
    }
  }

  async getCourtAvailability(courtId, date) {
    try {
      const response = await scheduleApi.get(`${this.baseURL}/${courtId}/availability`, {
        params: { date }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get court availability error:', error);
      throw error;
    }
  }

  async validateBookingSlot(courtId, startTime, endTime) {
    try {
      const response = await scheduleApi.post(`${this.baseURL}/${courtId}/validate`, {
        startTime,
        endTime
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Validate booking slot error:', error);
      throw error;
    }
  }

  async getScheduleStatistics(courtId, startDate, endDate) {
    try {
      const response = await scheduleApi.get(`${this.baseURL}/${courtId}/statistics`, {
        params: { startDate, endDate }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get schedule statistics error:', error);
      throw error;
    }
  }

  async duplicateSchedule(sourceCourtId, targetCourtId) {
    try {
      const response = await scheduleApi.post(`${this.baseURL}/${sourceCourtId}/duplicate`, {
        targetCourtId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Duplicate schedule error:', error);
      throw error;
    }
  }

  async bulkUpdateSchedule(courtIds, schedule) {
    try {
      const response = await scheduleApi.put(`${this.baseURL}/bulk-update`, {
        courtIds,
        schedule
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Bulk update schedule error:', error);
      throw error;
    }
  }

  async getHolidayTemplate() {
    try {
      const response = await scheduleApi.get(`${this.baseURL}/holiday-template`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get holiday template error:', error);
      throw error;
    }
  }

  async applyHolidaySchedule(courtId, holidayConfig) {
    try {
      const response = await scheduleApi.put(`${this.baseURL}/${courtId}/holiday-schedule`, {
        holidayConfig
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Apply holiday schedule error:', error);
      throw error;
    }
  }
}

const scheduleService = new ScheduleService();
export { scheduleService };
