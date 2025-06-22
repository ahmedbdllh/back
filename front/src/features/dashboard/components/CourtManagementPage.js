import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import CourtManagement from '../../court/components/CourtManagement';
import { getCompaniesByManager } from '../../court/services/companyService';
import { useToast, ToastContainer } from '../../../shared/ui/components/Toast';

function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    return null;
  }
}

export default function CourtManagementPage() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const fetchedRef = useRef(false);
  const { toasts, success, error, warning, removeToast } = useToast();
  // Get the selected company details
  const selectedCompany = companies.find(c => c._id === selectedCompanyId);
  const isCompanyApproved = selectedCompany?.isVerified && selectedCompany?.status === 'Active';

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const currentUser = getCurrentUser();
    if (currentUser?.id) {
      getCompaniesByManager(currentUser.id)
        .then(res => {
          setCompanies(res.data);
          window.__companiesList = res.data;
          if (res.data.length > 0) setSelectedCompanyId(res.data[0]._id);
        })
        .catch(() => setCompanies([]));
    }
  }, []);  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Company Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg">
            <Building2 size={18} className="text-white sm:hidden" />
            <Building2 size={20} className="text-white hidden sm:block" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white">Select Company</h3>
        </div>        <select 
          value={selectedCompanyId} 
          onChange={e => setSelectedCompanyId(e.target.value)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/80 border border-white/20 rounded-lg sm:rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all duration-200 hover:bg-gray-800 backdrop-blur-sm"
        >
          <option value="" disabled className="bg-gray-900 text-gray-400">Choose a company...</option>          {companies.map(company => {
            const companyApproved = company.isVerified && company.status === 'Active';
            return (
              <option 
                key={company._id || company.id} 
                value={company._id || company.id}
                className="bg-gray-900 text-white py-2 hover:bg-gray-800"
              >
                {company.companyName || company.name || 'Unnamed Company'} {!companyApproved ? '(Pending Approval)' : ''}
              </option>
            );
          })}
        </select>

        {/* Company Approval Status */}
        {selectedCompany && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-lg border"
            style={{
              backgroundColor: isCompanyApproved ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: isCompanyApproved ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
            }}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCompanyApproved ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className={`text-sm font-medium ${isCompanyApproved ? 'text-green-400' : 'text-red-400'}`}>
                {isCompanyApproved ? 'Company Approved' : 'Pending Admin Approval'}
              </span>
            </div>
            {!isCompanyApproved && (
              <p className="text-xs text-red-300 mt-1">
                Your company needs admin approval before you can add courts. Please contact an administrator.
              </p>
            )}
          </motion.div>
        )}
      </motion.div>      {/* Court Management */}
      {selectedCompanyId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >          <CourtManagement 
            companyId={selectedCompanyId} 
            companyApproved={isCompanyApproved}
            toast={{ success, error, warning }}
          />
        </motion.div>
      )}

      {/* Empty State */}
      {!selectedCompanyId && companies.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-white/40 mb-4">
            <Building2 size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-white/60 mb-2">No companies found</h3>
          <p className="text-white/40">You need to have at least one company to manage courts</p>
        </motion.div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
