import React, { useMemo, useEffect, useState } from 'react';
import CourtManagement from './components/CourtManagement';
import { getCompaniesByManager } from './services/companyService';

function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

export default function CourtManagementPage() {
  const user = useMemo(() => getCurrentUser(), []);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  useEffect(() => {
    if (user?._id) {
      getCompaniesByManager(user._id)
        .then(res => {
          setCompanies(res.data);
          if (res.data.length > 0) setSelectedCompanyId(res.data[0]._id);
        })
        .catch(() => setCompanies([]));
    }
  }, [user]);

  return (
    <div>
      <h2>Court Management</h2>
      <div>My Companies</div>
      <select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}>
        {companies.map(company => (
          <option key={company._id} value={company._id}>{company.companyName}</option>
        ))}
      </select>
      {selectedCompanyId && <CourtManagement companyId={selectedCompanyId} />}
    </div>
  );
}
