import React, { useState, useEffect } from 'react';
import { Card } from '../shared/ui/components/Card';
import { ToastContainer, useToast } from '../shared/ui/components/Toast';
import Pagination from '../shared/ui/components/Pagination';
import SearchBar from '../shared/ui/components/SearchBar';
import DataTable from '../shared/ui/components/DataTable';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  Building,
  UserCheck
} from 'lucide-react';

const CourtManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Search and filter states
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courtFilter, setCourtFilter] = useState('all');
  
  const { toasts, success, error: showError, removeToast } = useToast();

  // Search configuration
  const searchFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'courtId',
      label: 'Court',
      options: courts.length > 0 ? courts.map(court => ({
        value: court._id,
        label: `${court.name} (${court.companyName})`
      })) : []
    }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'userDetails.name', label: 'Player Name' },
    { value: 'companyName', label: 'Company' }
  ];

  const handleSearch = (searchParams) => {
    // Update search states
    setSearchQuery(searchParams.query || '');
    setStatusFilter(searchParams.status || 'all');
    setCourtFilter(searchParams.courtId || 'all');
    
    // Reset to first page when search changes
    setCurrentPage(1);
  };

  // Apply filters whenever bookings or filter states change
  const applyFilters = () => {
    let filtered = [...bookings];
    
    // Apply search query filter
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(booking => 
        booking.userDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.teamDetails?.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.companyDetails?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.courtDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'confirmed') {
        filtered = filtered.filter(booking => booking.status !== 'cancelled');
      } else if (statusFilter === 'cancelled') {
        filtered = filtered.filter(booking => booking.status === 'cancelled');
      }
    }
    
    // Apply court filter
    if (courtFilter && courtFilter !== 'all') {
      filtered = filtered.filter(booking => {
        return booking.courtId === courtFilter;
      });
    }
    
    setFilteredBookings(filtered);
  };

  // Effect to apply filters when dependencies change
  React.useEffect(() => {
    applyFilters();
  }, [bookings, searchQuery, statusFilter, courtFilter]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Get current page data from filtered results
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Fetch manager's companies and their bookings
  const fetchManagerData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Authentication required');
        return;
      }

      // Get user info first
      const userResponse = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const userId = userData.user?._id || userData.user?.id;
        
        if (userId) {
          // Get all companies owned by this manager
          const companiesResponse = await fetch(`http://localhost:5001/api/companies/owner/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (companiesResponse.ok) {
            const companiesData = await companiesResponse.json();
            const companies = Array.isArray(companiesData) ? companiesData : (companiesData.companies || []);
            
            
            // Get all bookings for all companies
            let allBookings = [];
            let allCourts = [];
            
            for (const company of companies) {
              // Get courts for this company
              try {
                const courtsResponse = await fetch(`http://localhost:5003/api/courts/company/${company._id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (courtsResponse.ok) {
                  const courtsData = await courtsResponse.json();
                  
                  const companyCourts = (courtsData.courts || []).map(court => ({
                    ...court,
                    companyName: company.companyName
                  }));
                  allCourts.push(...companyCourts);
                }
              } catch (error) {
                console.warn('Failed to fetch courts for company:', company._id, error);
              }
              
              // Get bookings for this company
              try {
                const bookingsUrl = `http://localhost:5005/api/bookings/company/${company._id}?limit=1000`;
                
                const bookingsResponse = await fetch(bookingsUrl, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (bookingsResponse.ok) {
                  const bookingsData = await bookingsResponse.json();
                  
                  const companyBookings = (bookingsData.bookings || []).map(booking => ({
                    ...booking,
                    companyName: company.companyName
                  }));
                  allBookings.push(...companyBookings);
                } else {
                  const errorText = await bookingsResponse.text();
                  console.error(`❌ Bookings fetch failed for ${company.companyName}:`, errorText);
                }
              } catch (error) {
                console.warn('Failed to fetch bookings for company:', company._id, error);
              }
            }
            
            setCourts(allCourts);
            setBookings(allBookings);
            // Initialize filtered bookings with all bookings
            setFilteredBookings(allBookings);
          } else {
            const errorText = await companiesResponse.text();
            console.error('❌ Companies fetch failed:', errorText);
            setError('Failed to load companies');
          }
        } else {
          setError('No user ID found');
        }
      } else {
        const errorText = await userResponse.text();
        setError('Failed to get user information');
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  // Define columns for DataTable
  const columns = [
    {
      Header: 'Court Name',
      accessor: 'courtName',
      Cell: ({ row }) => {
        const court = courts.find(c => c._id === row.courtId);
        const courtName = court?.name || row.courtDetails?.name || 'Unknown Court';
        return (
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" />
            <span className="font-medium text-slate-100">{courtName}</span>
          </div>
        );
      },
    },
    {
      Header: 'Company Name',
      accessor: 'companyName',
      Cell: ({ row }) => {
        const court = courts.find(c => c._id === row.courtId);
        const companyName = court?.companyName || row.companyName || row.companyDetails?.companyName || 'Unknown Company';
        return (
          <div className="flex items-center gap-2">
            <Building size={16} className="text-green-400" />
            <span className="text-slate-300">{companyName}</span>
          </div>
        );
      },
    },
    {
      Header: 'Player Name',
      accessor: 'playerName',
      Cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserCheck size={16} className="text-purple-400" />
          <span className="text-slate-300">{row.userDetails?.name || 'Unknown Player'}</span>
        </div>
      ),
    },
    {
      Header: 'Team Name',
      accessor: 'teamName',
      Cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users size={16} className="text-orange-400" />
          <span className="text-slate-300">{row.teamDetails?.teamName || 'No Team'}</span>
        </div>
      ),
    },
    {
      Header: 'Date & Time',
      accessor: 'date',
      Cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-slate-300">{formatDate(row.date)}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Clock size={14} className="text-gray-400" />
            <span className="text-sm text-slate-400">
              {formatTime(row.startTime)} - {formatTime(row.endTime)}
            </span>
          </div>
        </div>
      ),
    },
    {
      Header: 'Price per Person',
      accessor: 'price',
      Cell: () => (
        <span className="font-semibold text-green-400">15 DT</span>
      ),
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => {
        if (value === 'cancelled') {
          return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-red-500/80">
              <XCircle size={14} className="mr-1.5" />
              Cancelled
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-green-500/80">
              <CheckCircle size={14} className="mr-1.5" />
              Confirmed
            </span>
          );
        }
      },
    },
  ];

  useEffect(() => {
    fetchManagerData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-[#0F172A] rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 bg-[#0F172A] rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-white mb-4">Court Management Dashboard</h2>
        <p className="text-gray-400 mb-6">Manage bookings across all your companies and courts</p>
        
        {/* Advanced Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          filters={searchFilters}
          sortOptions={sortOptions}
          placeholder="Search bookings by player or team name..."
          className="mb-6"
        />

        {error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : currentBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' || courtFilter !== 'all'
                ? "Try adjusting your search filters to see more results." 
                : "You don't have any bookings yet."}
            </p>
          </div>
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={currentBookings} 
              itemsPerPage={itemsPerPage}
            />
            
            {/* Pagination */}
            {filteredBookings.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={filteredBookings.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                className="mt-6"
              />
            )}
          </>
        )}
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default CourtManagementDashboard;
