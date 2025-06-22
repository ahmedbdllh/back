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

const PlayerManagement = () => {
  const [players, setPlayers] = useState([]);
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
    changeItemsPerPage  } = useAdvancedSearch({
    sport: 'all',
    position: 'all',
    status: 'all',
    limit: 5
  });
  // Use useRef to track if we're already fetching to prevent multiple calls
  const isFetchingRef = useRef(false);
  const searchParamsRef = useRef(searchParams);
  const lastSearchParamsRef = useRef(null);
  
  // Update ref when searchParams changes
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

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
      key: 'sport',
      label: 'Sport',
      options: [
        { value: 'football', label: 'Football' },
        { value: 'basketball', label: 'Basketball' },
        { value: 'tennis', label: 'Tennis' },
        { value: 'padel', label: 'Padel' }
      ]
    },
    {
      key: 'position',
      label: 'Position',
      options: [
        { value: 'goalkeeper', label: 'Goalkeeper' },
        { value: 'defender', label: 'Defender' },
        { value: 'midfielder', label: 'Midfielder' },
        { value: 'forward', label: 'Forward' }
      ]
    },
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
    { value: 'preferredSport', label: 'Sport' },
    { value: 'createdAt', label: 'Join Date' }  ];  // Simplified fetch function that doesn't depend on hook functions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchPlayers = useCallback(async () => {
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

      console.log('Fetching players with params:', queryParams.toString());

      const response = await axios.get(`${API_URL}/auth/players?${queryParams.toString()}`, {
        headers: {
          'x-auth-token': token
        }
      });      if (response.data.success) {
        console.log('Raw player data:', response.data.data[0]); // Debug: log first player
        console.log('All player fields:', Object.keys(response.data.data[0])); // Show all available fields
        const formattedPlayers = response.data.data.map(player => {
          // Debug each player's sport-related fields
          console.log('Player sport fields:', {
            sport: player.sport,
            preferredSport: player.preferredSport,
            sports: player.sports,
            favoriteSport: player.favoriteSport,
            favoredSport: player.favoredSport
          });          // Handle sport as an array - the field is called 'preferredSports'
          let sportDisplay = 'Not specified';
          if (player.preferredSports && Array.isArray(player.preferredSports) && player.preferredSports.length > 0) {
            sportDisplay = player.preferredSports.map(sport => 
              sport.charAt(0).toUpperCase() + sport.slice(1) // Capitalize first letter
            ).join(', ');
          }
          
          return {
            id: player._id,
            name: player.fullName || 'Unknown',
            email: player.email || 'No email',
            phoneNumber: player.phoneNumber || 'Not provided',
            preferredSport: sportDisplay,
            position: player.position || 'Not specified',
            status: player.isVerified ? 'Active' : 'Inactive',
            profileImage: player.profileImage ? `/uploads/${player.profileImage.split(/[\\/]/).pop()}` : null,
            createdAt: player.createdAt ? new Date(player.createdAt).toLocaleDateString() : 'Unknown'
          };        });
        
        // Add 20 mock players to demonstrate pagination and sport badges
        const mockPlayers = [
          {
            id: 'mock-1',
            name: 'John Smith',
            email: 'john.smith@example.com',
            phoneNumber: '12345678',
            preferredSport: 'Football',
            position: 'Forward',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-2',
            name: 'Sarah Johnson',
            email: 'sarah.j@example.com',
            phoneNumber: '23456789',
            preferredSport: 'Basketball, Tennis',
            position: 'Guard',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-3',
            name: 'Mike Wilson',
            email: 'mike.w@example.com',
            phoneNumber: '34567890',
            preferredSport: 'Football, Basketball, Tennis, Padel',
            position: 'Midfielder',
            status: 'Inactive',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-4',
            name: 'Emma Davis',
            email: 'emma.d@example.com',
            phoneNumber: '45678901',
            preferredSport: 'Padel, Tennis',
            position: 'Defender',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-5',
            name: 'Alex Rodriguez',
            email: 'alex.r@example.com',
            phoneNumber: '56789012',
            preferredSport: 'Basketball',
            position: 'Center',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-6',
            name: 'Lisa Chen',
            email: 'lisa.c@example.com',
            phoneNumber: '67890123',
            preferredSport: 'Tennis, Padel',
            position: 'Attacker',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-7',
            name: 'David Brown',
            email: 'david.b@example.com',
            phoneNumber: '78901234',
            preferredSport: 'Football, Basketball',
            position: 'Goalkeeper',
            status: 'Inactive',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-8',
            name: 'Maria Garcia',
            email: 'maria.g@example.com',
            phoneNumber: '89012345',
            preferredSport: 'Tennis',
            position: 'Forward',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-9',
            name: 'James Taylor',
            email: 'james.t@example.com',
            phoneNumber: '90123456',
            preferredSport: 'Basketball, Football',
            position: 'Defender',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-10',
            name: 'Anna White',
            email: 'anna.w@example.com',
            phoneNumber: '01234567',
            preferredSport: 'Padel',
            position: 'Midfielder',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-11',
            name: 'Robert Lee',
            email: 'robert.l@example.com',
            phoneNumber: '11223344',
            preferredSport: 'Football, Tennis, Basketball',
            position: 'Wing',
            status: 'Inactive',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-12',
            name: 'Jessica Moore',
            email: 'jessica.m@example.com',
            phoneNumber: '22334455',
            preferredSport: 'Tennis, Padel',
            position: 'Forward',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-13',
            name: 'Chris Anderson',
            email: 'chris.a@example.com',
            phoneNumber: '33445566',
            preferredSport: 'Basketball',
            position: 'Point Guard',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-14',
            name: 'Sophie Martin',
            email: 'sophie.m@example.com',
            phoneNumber: '44556677',
            preferredSport: 'Football, Padel',
            position: 'Striker',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-15',
            name: 'Kevin Thompson',
            email: 'kevin.t@example.com',
            phoneNumber: '55667788',
            preferredSport: 'Tennis',
            position: 'Defender',
            status: 'Inactive',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-16',
            name: 'Rachel Green',
            email: 'rachel.g@example.com',
            phoneNumber: '66778899',
            preferredSport: 'Basketball, Tennis, Padel',
            position: 'Guard',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-17',
            name: 'Daniel Clark',
            email: 'daniel.c@example.com',
            phoneNumber: '77889900',
            preferredSport: 'Football',
            position: 'Midfielder',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-18',
            name: 'Michelle Adams',
            email: 'michelle.a@example.com',
            phoneNumber: '88990011',
            preferredSport: 'Padel, Basketball',
            position: 'Center',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-19',
            name: 'Ryan Parker',
            email: 'ryan.p@example.com',
            phoneNumber: '99001122',
            preferredSport: 'Football, Tennis',
            position: 'Winger',
            status: 'Inactive',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          },
          {
            id: 'mock-20',
            name: 'Olivia Turner',
            email: 'olivia.t@example.com',
            phoneNumber: '00112233',
            preferredSport: 'Basketball, Football, Tennis, Padel',
            position: 'All-rounder',
            status: 'Active',
            profileImage: null,
            createdAt: new Date().toLocaleDateString()
          }
        ];
        
        // Combine real data with mock data for demonstration
        const combinedPlayers = [...formattedPlayers, ...mockPlayers];
        setPlayers(combinedPlayers);
        // Call updatePagination but don't depend on it
        updatePagination({
          page: response.data.page || 1,
          pages: response.data.pages || 1,
          total: response.data.total || 0,
          count: response.data.count || 0
        });
        console.log('Players loaded successfully:', formattedPlayers.length);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch players');
      console.error('Error fetching players:', err);    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      console.log('Loading set to false');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies at all
  const handleSearch = useCallback((newSearchParams) => {
    updateSearchParams(newSearchParams);
  }, [updateSearchParams]);

  // Helper function to compare search params deeply
  const areSearchParamsEqual = (params1, params2) => {
    if (!params1 || !params2) return false;
    const keys1 = Object.keys(params1);
    const keys2 = Object.keys(params2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => params1[key] === params2[key]);
  };

  // Effect to fetch players when search params change (debounced)
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
        fetchPlayers();
      }
    } else {
      // Debounce the API call for subsequent changes
      const timeoutId = setTimeout(() => {
        if (!isFetchingRef.current) {
          fetchPlayers();
        }
      }, 300);

      return () => {
        clearTimeout(timeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // fetchPlayers is stable with no dependencies

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
    },
    {
      Header: 'Email',
      accessor: 'email',
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
    },    {
      Header: 'Sport',
      accessor: 'preferredSport',
      Cell: ({ value }) => {
        if (value === 'Not specified') {
          return <span className="text-slate-400 italic text-sm">{value}</span>;
        }
        
        // Define sport-specific colors and emojis
        const getSportStyle = (sport) => {
          const sportLower = sport.toLowerCase();
          switch (sportLower) {
            case 'football':
              return {
                bg: 'bg-green-500/20',
                text: 'text-green-300',
                border: 'border-green-500/40',
                emoji: '⚽'
              };
            case 'basketball':
              return {
                bg: 'bg-orange-500/20',
                text: 'text-orange-300',
                border: 'border-orange-500/40',
                emoji: '🏀'
              };
            case 'tennis':
              return {
                bg: 'bg-yellow-500/20',
                text: 'text-yellow-300',
                border: 'border-yellow-500/40',
                emoji: '🎾'
              };
            case 'padel':
              return {
                bg: 'bg-purple-500/20',
                text: 'text-purple-300',
                border: 'border-purple-500/40',
                emoji: '🏓'
              };
            default:
              return {
                bg: 'bg-blue-500/20',
                text: 'text-blue-300',
                border: 'border-blue-500/40',
                emoji: '🏃'
              };
          }
        };
        
        const sports = value.split(', ');
        
        // If more than 2 sports, show first 2 + count
        if (sports.length > 2) {
          const visibleSports = sports.slice(0, 2);
          const remainingCount = sports.length - 2;
          
          return (
            <div className="flex items-center gap-1 flex-wrap max-w-[180px]">
              {visibleSports.map((sport, index) => {
                const style = getSportStyle(sport);
                return (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${style.bg} ${style.text} ${style.border} border`}
                  >
                    <span className="text-xs">{style.emoji}</span>
                    {sport}
                  </span>
                );
              })}
              <span 
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-600/50 text-slate-300 border border-slate-500/40"
                title={`Also plays: ${sports.slice(2).join(', ')}`}
              >
                +{remainingCount}
              </span>
            </div>
          );
        }
        
        // For 2 or fewer sports, show all normally
        return (
          <div className="flex items-center gap-1 flex-wrap max-w-[180px]">
            {sports.map((sport, index) => {
              const style = getSportStyle(sport);
              return (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${style.bg} ${style.text} ${style.border} border`}
                >
                  <span className="text-xs">{style.emoji}</span>
                  {sport}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      Header: 'Position',
      accessor: 'position',
      Cell: ({ value }) => (
        <span className="text-slate-300 capitalize">{value}</span>
      ),
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
    },
    {
      Header: 'Joined',
      accessor: 'createdAt',
      Cell: ({ value }) => (
        <span className="text-slate-300">{value}</span>
      ),
    },
    {
      Header: 'Actions',
      accessor: 'Actions',
      Cell: ({ row }) => (
        <div className="flex space-x-2">          <button
            onClick={() => warning(`Edit functionality for ${row.name} is not implemented yet`)}
            className="text-sky-400 hover:text-sky-300 transition-colors p-1 rounded-md hover:bg-sky-500/10"
            title="Edit Player"
          >
            <Edit size={18} />
          </button>          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Delete Player',
                message: `Are you sure you want to delete ${row.name}? This action cannot be undone.`,
                onConfirm: async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await axios.delete(`${API_URL}/auth/player/${row.id}`, {
                      headers: {
                        'x-auth-token': token
                      }
                    });                    if(response.data.success) {
                      setPlayers(prev => prev.filter(player => player.id !== row.id));
                      success(`${row.name} deleted successfully.`);
                      // Refresh the list to update pagination
                      fetchPlayers();
                    } else {
                      showError(response.data.msg || 'Failed to delete player.');
                    }
                  } catch (err) {
                    showError(err.response?.data?.msg || 'Error deleting player.');
                  }
                },
                type: 'danger'
              });
            }}
            className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-md hover:bg-red-500/10"
            title="Delete Player"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    },
  ];  return (
    <>
      <div className="p-6 bg-[#0F172A] rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-white mb-4">Player Management</h2>
        
        {/* Advanced Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          filters={searchFilters}
          sortOptions={sortOptions}
          placeholder="Search players by name, email, or phone..."
          className="mb-6"
        />

        {loading ? (
          <div className="text-center py-8">Loading players...</div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={players} 
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

export default PlayerManagement;