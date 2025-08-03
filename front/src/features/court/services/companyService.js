import axios from 'axios';

const COMPANY_API_URL = 'http://localhost:5001/api/companies';

// Simple in-memory cache for companies by manager
const companiesCache = {};

export const getCompaniesByManager = (managerId) => {
  if (companiesCache[managerId]) {
    // Return a resolved promise with cached data
    return Promise.resolve({ data: companiesCache[managerId] });
  }
  const token = localStorage.getItem('token');
  console.log('Making API call to:', `${COMPANY_API_URL}/owner/${managerId}`);
  console.log('With token:', token ? 'Token exists' : 'No token');
  return axios.get(`${COMPANY_API_URL}/owner/${managerId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(res => {
    companiesCache[managerId] = res.data;
    return res;
  });
};
