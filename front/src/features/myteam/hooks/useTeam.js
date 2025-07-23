import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useTeam = () => {
  const [hasTeam, setHasTeam] = useState(false);
  const [team, setTeam] = useState(null);

  const fetchTeam = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await axios.get('http://localhost:5000/api/teams/my-team', {
          headers: { 'x-auth-token': token },
        });
        setTeam(res.data);
        setHasTeam(true);
      } catch (err) {
        setTeam(null);
        setHasTeam(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return { hasTeam, team, fetchTeam, setTeam, setHasTeam };
};
