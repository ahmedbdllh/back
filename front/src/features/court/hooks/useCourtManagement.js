import { useState } from 'react';
import * as courtService from '../services/courtService';

export function useCourtManagement(companyId) {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourts = async () => {
    setLoading(true);
    try {
      const res = await courtService.getCourtsByCompany(companyId);
      setCourts(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  const addCourt = async (court) => {
    setLoading(true);
    try {
      await courtService.createCourt(court);
      await fetchCourts();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateCourt = async (id, court) => {
    setLoading(true);
    try {
      await courtService.updateCourt(id, court);
      await fetchCourts();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCourt = async (id) => {
    setLoading(true);
    try {
      await courtService.deleteCourt(id);
      await fetchCourts();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { courts, loading, error, fetchCourts, addCourt, updateCourt, deleteCourt };
}
