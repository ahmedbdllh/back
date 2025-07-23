import React, { useState, useEffect, useCallback, useRef } from 'react';
import DataTable from '../../../../shared/ui/components/DataTable';
import SearchBar from '../../../../shared/ui/components/SearchBar';
import Pagination from '../../../../shared/ui/components/Pagination';
import { Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { Avatar } from '../../../../shared/ui/components/Avatar';
import { useToast, ToastContainer } from '../../../../shared/ui/components/Toast';
import ConfirmModal from '../../../../shared/ui/components/ConfirmModal';
import { useAdvancedSearch } from '../../../../hooks/useAdvancedSearch';
import axios from 'axios';
import { API_URL } from '../../../../shared/constants/config';

const ManagerManagement = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toasts, removeToast, success, error: showError, warning } = useToast();
    // Advanced search hook
  const {
    searchParams,
    pagination,
    updateSearchParams,
    updatePagination,
    changePage,
    changeItemsPerPage
  } = useAdvancedSearch({
    status: 'all'
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  // Search filters configuration
  const searchFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];
  const sortOptions = [
    { value: 'fullName', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'createdAt', label: 'Join Date' }
  ];  // Use useRef to track if we're already fetching to prevent multiple calls
  const isFetchingRef = useRef(false);
  const searchParamsRef = useRef(searchParams);
  const lastSearchParamsRef = useRef(null);
  
  // Update ref when searchParams changes
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);
  // Simplified fetch function that doesn't depend on hook functions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchManagers = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Build query parameters using ref to avoid dependency
      const queryParams = new URLSearchParams();
      Object.entries(searchParamsRef.current).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      console.log('Fetching managers with params:', queryParams.toString());

      const response = await axios.get(`${API_URL}/auth/managers?${queryParams.toString()}`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.success) {            const formattedManagers = response.data.data.map(manager => ({
          id: manager._id,
          name: manager.fullName || 'Unknown',
          email: manager.email || 'No email',
          cin: manager.cin || 'N/A',
          phoneNumber: manager.phoneNumber || 'N/A',
          companyName: manager.companyName || 'N/A',
          status: manager.isVerified ? 'Active' : 'Inactive',
          profileImage: manager.profileImage ? `/uploads/${manager.profileImage.split(/[\\/]/).pop()}` : null,
          attachment: manager.attachment
        }));
        setManagers(formattedManagers);
        // Call updatePagination but don't depend on it
        updatePagination({
          page: response.data.page || 1,
          pages: response.data.pages || 1,
          total: response.data.total || 0,
          count: response.data.count || 0
        });
        console.log('Managers loaded successfully:', formattedManagers.length);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch managers');
      console.error('Error fetching managers:', err);
    } finally {
      setLoading(false);      isFetchingRef.current = false;
      console.log('Loading set to false');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies at all

  const handleSearch = useCallback((newSearchParams) => {
    updateSearchParams(newSearchParams);
  }, [updateSearchParams]);  // Helper function to compare search params deeply
  const areSearchParamsEqual = (params1, params2) => {
    if (!params1 || !params2) return false;
    const keys1 = Object.keys(params1);
    const keys2 = Object.keys(params2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => params1[key] === params2[key]);
  };  // Effect to fetch managers when search params change (debounced)
  useEffect(() => {
    console.log('useEffect triggered with searchParams:', searchParams);
    
    // Always allow the first fetch (when lastSearchParamsRef.current is null)
    const isFirstFetch = lastSearchParamsRef.current === null;
    
    // Check if searchParams actually changed in value (skip this check for first fetch)
    if (!isFirstFetch && areSearchParamsEqual(searchParams, lastSearchParamsRef.current)) {
      console.log('SearchParams are the same, skipping fetch');
      setLoading(false);
      return;
    }
    
    // Update the last searchParams reference
    lastSearchParamsRef.current = { ...searchParams };
    
    // For first fetch, call immediately. For subsequent changes, debounce
    if (isFirstFetch) {
      console.log('First fetch, calling immediately');
      if (!isFetchingRef.current) {
        fetchManagers();
      }
    } else {
      // Debounce the API call for subsequent changes
      const timeoutId = setTimeout(() => {
        if (!isFetchingRef.current) {
          fetchManagers();
        }
      }, 300);

      return () => {
        clearTimeout(timeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // fetchManagers is stable with no dependencies

  const columns = [
    {
      Header: 'Profile',
      accessor: 'profileImage',
      Cell: ({ value, row }) => (
        <div className="flex items-center justify-center">
          <Avatar 
            src={value ? `http://localhost:5000${value}` : null}
            alt={row.name}
            size="sm"
            className="border border-slate-600"
          />
        </div>
      ),
    },
    {
      Header: 'Name',
      accessor: 'name',
      Cell: ({ value }) => (
        <span className="font-medium text-slate-100">{value}</span>
      ),
    },    {
      Header: 'Email',
      accessor: 'email',
      Cell: ({ value }) => (
        <span className="text-slate-300">{value}</span>
      ),
    },
    {
      Header: 'CIN',
      accessor: 'cin',
      Cell: ({ value }) => (
        <span className="text-slate-300">{value}</span>
      ),
    },
    {
      Header: 'Phone',
      accessor: 'phoneNumber',
      Cell: ({ value }) => (
        <span className="text-slate-300">{value}</span>
      ),
    },
    {
      Header: 'Company',
      accessor: 'companyName',
      Cell: ({ value }) => {
        if (!value || value === 'N/A') {
          return <span className="text-slate-400">No company</span>;
        }
        
        // Handle both array and string formats
        const companies = Array.isArray(value) ? value : [value];
        const validCompanies = companies.filter(company => company && company.trim() && company !== 'N/A');
        
        if (validCompanies.length === 0) {
          return <span className="text-slate-400">No company</span>;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {validCompanies.slice(0, 2).map((company, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {company.trim()}
              </span>
            ))}
            {validCompanies.length > 2 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-500/20 text-slate-300">
                +{validCompanies.length - 2} more
              </span>
            )}
          </div>
        );
      }
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => {
        const isActive = value === 'Active';
        const bgColor = isActive ? 'bg-green-500/80' : 'bg-red-500/80';
        const icon = isActive ? <UserCheck size={14} className="mr-1.5" /> : <UserX size={14} className="mr-1.5" />;
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${bgColor}`}>
            {icon}
            {value}
          </span>
        );
      }
    },    {
      Header: 'Attachment',
      accessor: 'attachment',
      Cell: ({ value }) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return <span className="text-slate-400">No attachment</span>;
        }
        // Extract filename from the full path
        const attachmentPath = value[0]; // Get first attachment
        const filename = attachmentPath.split(/[\\/]/).pop(); // Handle both / and \ separators
        const attachmentUrl = `http://localhost:5000/uploads/${filename}`;
        return (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 hover:underline"
          >
            View Attachment
          </a>
        );
      }
    },
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ row }) => {
        const isInactive = row.status === 'Inactive';
        return (
          <div className="flex space-x-2">            <button
              onClick={() => showError(`Edit functionality for ${row.name} is not implemented yet`)}
              className="text-sky-400 hover:text-sky-300 transition-colors p-1 rounded-md hover:bg-sky-500/10"
              title="Edit Manager"
            >
              <Edit size={18} />
            </button>
            {isInactive && (
              <>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const response = await axios.put(`${API_URL}/auth/manager/approve/${row.id}`, {}, {
                        headers: {
                          'x-auth-token': token
                        }
                      });                      if (response.data.success) {
                        success(`${row.name} approved successfully and an email has been sent.`);
                        setManagers(prevManagers => 
                          prevManagers.map(manager => 
                            manager.id === row.id ? { ...manager, status: 'Active' } : manager
                          )
                        );
                      } else {
                        showError(`Failed to approve ${row.name}: ${response.data.msg}`);
                      }
                    } catch (err) {
                      console.error('Error approving manager:', err);
                      showError(`Error approving ${row.name}: ${err.response?.data?.msg || err.message}`);
                    }
                  }}
                  className="text-green-400 hover:text-green-300 transition-colors p-1 rounded-md hover:bg-green-500/10"
                  title="Approve Manager"
                >
                  <UserCheck size={18} />
                </button>
                <button                  onClick={() => {
                    const updatedManagers = managers.map(manager => 
                      manager.id === row.id ? { ...manager, status: 'Inactive' } : manager
                    );
                    setManagers(updatedManagers);
                    warning(`${row.name} has been denied`);
                  }}
                  className="text-orange-400 hover:text-orange-300 transition-colors p-1 rounded-md hover:bg-orange-500/10"
                  title="Deny Manager"
                >
                  <UserX size={18} />
                </button>
              </>
            )}            <button
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Delete Manager',
                  message: `Are you sure you want to delete ${row.name}? This action cannot be undone.`,
                  onConfirm: async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const response = await axios.delete(`${API_URL}/auth/manager/${row.id}`, {
                        headers: {
                          'x-auth-token': token
                        }
                      });                      if(response.data.success) {
                        setManagers(prev => prev.filter(manager => manager.id !== row.id));
                        success(`${row.name} deleted successfully.`);
                        // Refresh the list to update pagination
                        fetchManagers();
                      } else {
                        showError(response.data.msg || 'Failed to delete manager.');
                      }
                    } catch (err) {
                      showError(err.response?.data?.msg || 'Error deleting manager.');
                    }
                  },
                  type: 'danger'
                });
              }}
              className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-md hover:bg-red-500/10"
              title="Delete Manager"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      }
    },
  ];

  return (
    <>
      <div className="p-6 bg-[#0F172A] rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-white mb-4">Manager Management</h2>
        
        {/* Advanced Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          filters={searchFilters}
          sortOptions={sortOptions}
          placeholder="Search managers by name, email, CIN, or phone..."
          className="mb-6"
        />

        {loading ? (
          <div className="text-center py-8">Loading managers...</div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={managers} 
              itemsPerPage={searchParams.limit}
            />
            
            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              total={pagination.total}
              itemsPerPage={searchParams.limit}
              onPageChange={changePage}
              onItemsPerPageChange={changeItemsPerPage}
              className="mt-6"
            />
          </>
        )}
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

export default ManagerManagement;