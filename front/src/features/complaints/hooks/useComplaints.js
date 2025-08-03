import { useState } from 'react';
import axios from 'axios';

const COMPLAINT_SERVICE_URL = 'http://localhost:5002/api/complaints';

export const useComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchComplaints = async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`${COMPLAINT_SERVICE_URL}?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setComplaints(response.data.data || []);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch complaints');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch complaints');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchMyComplaints = async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`${COMPLAINT_SERVICE_URL}/my-complaints?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setComplaints(response.data.data || []);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch your complaints');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch your complaints');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createComplaint = async (complaintData) => {
    try {
      setLoading(true);
      setError('');

      // Sanitize the data to ensure no circular references
      const sanitizedData = {
        title: complaintData.title,
        description: complaintData.description,
        category: complaintData.category,
        priority: complaintData.priority
      };

      // Only add relatedTo if it exists and is valid
      if (complaintData.relatedTo) {
        sanitizedData.relatedTo = {
          type: complaintData.relatedTo.type,
          referenceId: complaintData.relatedTo.referenceId,
          referenceName: complaintData.relatedTo.referenceName
        };
      }

      console.log('Sending complaint data:', sanitizedData);

      const response = await axios.post(COMPLAINT_SERVICE_URL, sanitizedData, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create complaint');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create complaint');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId, status, resolution) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.patch(
        `${COMPLAINT_SERVICE_URL}/${complaintId}/status`,
        { status, resolution },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update complaint status');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update complaint status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (complaintId, comment) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post(
        `${COMPLAINT_SERVICE_URL}/${complaintId}/comments`,
        { comment },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to add comment');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteComplaint = async (complaintId) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.delete(`${COMPLAINT_SERVICE_URL}/${complaintId}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete complaint');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete complaint');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getComplaintById = async (complaintId) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`${COMPLAINT_SERVICE_URL}/${complaintId}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch complaint');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch complaint');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    complaints,
    loading,
    error,
    fetchComplaints,
    fetchMyComplaints,
    createComplaint,
    updateComplaintStatus,
    addComment,
    deleteComplaint,
    getComplaintById
  };
};

export default useComplaints;
