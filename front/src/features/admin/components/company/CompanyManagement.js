import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icons } from '../../../../shared/ui/components/Icons';
import { useToast, ToastContainer } from '../../../../shared/ui/components/Toast';
import SearchBar from '../../../../shared/ui/components/SearchBar';
import axios from 'axios';
import CompanyHeader from './CompanyHeader';
import CompanyDetailsForm from './CompanyDetailsForm';
import CompanyDetailsView from './CompanyDetailsView';
import CompanySkeleton from './CompanySkeleton';
import AdminCompanyTable from './AdminCompanyTable'; // Import the new Admin table component

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]); // Changed from company to companies
  const [currentCompany, setCurrentCompany] = useState(null); // To store the selected company for view/edit
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false); // For editing the currentCompany
  const [isCreatingNewCompany, setIsCreatingNewCompany] = useState(false); // To toggle new company form
  const [editForm, setEditForm] = useState({}); // For the company being edited (currentCompany)
  const [newCompanyForm, setNewCompanyForm] = useState({ // Form state for a new company
    companyName: '',
    description: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    location: null, 
    locationChangedByUser: false, // To track if user interacted with map for new company
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showDetails, setShowDetails] = useState(true); // Default to true to show details or form
  const { toasts, removeToast, success, error: showError } = useToast();
  // Search parameters state (like in PlayerManagement.js)
  const [searchParams, setSearchParams] = useState({});
  
  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  // State for Nominatim search (shared between edit and create)
  const [addressQuery, setAddressQuery] = useState('');
  const [nominatimResults, setNominatimResults] = useState([]);
  const [nominatimLoading, setNominatimLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Search and filter state for admin view
  const [filterOptions, setFilterOptions] = useState({
    industries: [],
    statuses: [],
    verificationStatus: []
  });
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  
  // Use useRef to track if we're already fetching to prevent multiple calls
  const isFetchingRef = useRef(false);
  const searchParamsRef = useRef(searchParams);
  const lastSearchParamsRef = useRef(null);
  // Update ref when searchParams changes
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const getCurrentUser = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Fetch filter options for admin users
    if (user && user.role === 'Admin') {
      fetchFilterOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove getCurrentUser from dependencies to prevent loops
  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/companies/filter-options', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Filter options received:', response.data);
      setFilterOptions(response.data);
      setIsSearchEnabled(true);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Fallback: enable search with empty filters
      setFilterOptions({
        industries: [],
        statuses: [],
        verificationStatus: []
      });
      setIsSearchEnabled(true);
    }
  };
  // Simplified fetch function that doesn't depend on hook functions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchCompanies = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const user = getCurrentUser();
      if (!user) {
        showError('User not authenticated');
        setLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      
      let apiUrl;
      let params = {};
      
      if (user.role === 'Admin') {
        apiUrl = 'http://localhost:5001/api/companies/';
        // Build query parameters using ref to avoid dependency
        Object.entries(searchParamsRef.current).forEach(([key, value]) => {
          if (value && value !== 'all') {
            params[key] = value;
          }
        });
      } else {
        apiUrl = `http://localhost:5001/api/companies/owner/${user.id}`;
      }

      console.log('Fetching companies with params:', params);

      const response = await axios.get(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: params
      });
      
      let fetchedCompanies = [];
      if (user.role === 'Admin' && response.data.companies) {
        // New API response format with pagination
        fetchedCompanies = response.data.companies;
        setCompanies(response.data.companies);
      } else if (Array.isArray(response.data)) {
        fetchedCompanies = response.data;
        setCompanies(response.data);
      } else {
        console.error("Expected an array of companies, but received:", response.data);
        setCompanies([]); // Set to empty array if response is not an array
        if (user.role === 'Admin') { 
            showError("Failed to load company data: Unexpected format received.");
        }
      }

      if (user.role !== 'Admin' && fetchedCompanies.length > 0) {
        setCurrentCompany(fetchedCompanies[0]);
        setEditForm(fetchedCompanies[0]);
        const firstCompanyAddress = fetchedCompanies[0].address;
        setAddressQuery(firstCompanyAddress ? `${firstCompanyAddress.street || ''}, ${firstCompanyAddress.city || ''}`.trim().replace(/^,|,$/g,'') : '');
      } else if (user.role === 'Admin') {
        // For Admin, currentCompany is null, editForm is empty.
        setCurrentCompany(null); 
        setEditForm({});
      } else { 
        // This case covers: Manager with no companies (fetchedCompanies.length === 0)
        setCurrentCompany(null);
        setEditForm({});
      }
      console.log('Companies loaded successfully:', fetchedCompanies.length);
    } catch (err) {
      console.error('Error fetching companies:', err);
      showError(err.response?.data?.message || 'Failed to fetch company information');
      setCompanies([]); // Ensure companies is an empty array on error
      setCurrentCompany(null);
      setEditForm({});    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      console.log('Loading set to false');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies at all

  const handleSearch = useCallback((newSearchParams) => {
    console.log('Search triggered with params:', newSearchParams);
    setSearchParams(newSearchParams);
  }, []);

  // Helper function to compare search params deeply
  const areSearchParamsEqual = (params1, params2) => {
    if (!params1 || !params2) return false;
    const keys1 = Object.keys(params1);
    const keys2 = Object.keys(params2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => params1[key] === params2[key]);
  };

  // Effect to fetch companies when component mounts (initial load)
  useEffect(() => {
    console.log('useEffect triggered for initial load');
    
    // Always allow the first fetch (when lastSearchParamsRef.current is null)
    const isFirstFetch = lastSearchParamsRef.current === null;
    
    if (isFirstFetch) {
      console.log('First fetch, calling immediately');
      lastSearchParamsRef.current = {};
      if (!isFetchingRef.current) {
        fetchCompanies();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array for initial load only

  // Effect to handle search param changes with debouncing (like in PlayerManagement.js)
  useEffect(() => {
    console.log('Search useEffect triggered with searchParams:', searchParams);
    
    // Skip if this is the first load (handled by the other useEffect)
    if (lastSearchParamsRef.current === null) {
      console.log('Skipping search effect - initial load');
      return;
    }
    
    // Check if searchParams actually changed in value
    if (areSearchParamsEqual(searchParams, lastSearchParamsRef.current)) {
      console.log('SearchParams are the same, skipping fetch');
      return;
    }
    
    // Update the last searchParams reference
    lastSearchParamsRef.current = { ...searchParams };
    
    // Debounce the API call for search changes
    const timeoutId = setTimeout(() => {
      console.log('Debounced search fetch triggered');
      if (!isFetchingRef.current) {
        fetchCompanies();
      }
    }, 300);

    return () => {
      console.log('Clearing search timeout');
      clearTimeout(timeoutId);    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // fetchCompanies is stable with no dependencies

  const handleApproveCompany = async (companyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:5001/api/companies/${companyId}/verify`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data && response.data.company) {
        const updatedCompany = response.data.company;
        setCompanies(prevCompanies => 
          prevCompanies.map(c => c._id === companyId ? { ...c, ...updatedCompany } : c)
        );
        success('Company approved successfully.');
      } else {
        showError('Failed to approve company: Unexpected response.');
      }
    } catch (err) {
      console.error('Error approving company:', err);
      showError(err.response?.data?.message || 'Failed to approve company.');
    }
  };
  const handleSuspendCompany = async (companyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:5001/api/companies/${companyId}/suspend`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data && response.data.company) {
        const updatedCompany = response.data.company;
        setCompanies(prevCompanies => 
          prevCompanies.map(c => c._id === companyId ? { ...c, ...updatedCompany } : c)
        );
        success('Company suspended successfully.');
      } else {
        showError('Failed to suspend company: Unexpected response.');
      }
    } catch (err) {
      console.error('Error suspending company:', err);
      showError(err.response?.data?.message || 'Failed to suspend company.');
    }
  };const handleAdminDeleteCompany = async (companyId) => {
    // This is specifically for the Admin view, to avoid conflict with manager's handleDeleteCompany
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/companies/${companyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCompanies(prevCompanies => prevCompanies.filter(c => c._id !== companyId));
      success('Company deleted successfully by admin.');
    } catch (err) {
      console.error('Error deleting company by admin:', err);
      showError(err.response?.data?.message || 'Failed to delete company by admin.');
    }
  };

  const handleSelectCompany = (companyToSelect) => {
    if (isCreatingNewCompany) setIsCreatingNewCompany(false);
    if (editing) setEditing(false);
    
    setCurrentCompany(companyToSelect);
    setEditForm(companyToSelect);
    // Reset Nominatim search for the selected company
    const selectedCompanyAddress = companyToSelect.address;
    setAddressQuery(selectedCompanyAddress ? `${selectedCompanyAddress.street || ''}, ${selectedCompanyAddress.city || ''}`.trim().replace(/^,|,$/g,'') : '');
    setNominatimResults([]);
    setShowDetails(true); // Ensure details/form are visible when switching
  };

  const updateCompany = async () => {
    if (!currentCompany || !currentCompany._id) {
      showError('No company selected to update.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const address = editForm.address || {};
      const completeAddress = {
        street: address.street || '', city: address.city || '',
        state: address.state || '', zipCode: address.zipCode || '', country: address.country || ''
      };
      const { ownerId, ...safeEditForm } = editForm;
      const payload = { ...safeEditForm, address: completeAddress };
      
      const response = await axios.put(`http://localhost:5001/api/companies/${currentCompany._id}`, payload, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.data.company) {
        const updatedCompany = response.data.company;
        setCompanies(prevCompanies => prevCompanies.map(c => c._id === updatedCompany._id ? updatedCompany : c));
        setCurrentCompany(updatedCompany);
        setEditForm(updatedCompany);
        setEditing(false);
        success('Company information updated successfully');
      }
    } catch (err) {
      console.error('Error updating company:', err);
      showError(err.response?.data?.message || 'Failed to update company information');
    }
  };

  const handleCreateCompany = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = getCurrentUser();
      if (!user) {
        showError('User not authenticated. Cannot create company.');
        return;
      }

      const address = newCompanyForm.address || {};
      const completeAddress = {
        street: address.street || '', city: address.city || '',
        state: address.state || '', zipCode: address.zipCode || '', country: address.country || ''
      };

      const payload = {
        ...newCompanyForm,
        address: completeAddress,
        ownerId: user.id,
        ownerRole: 'Manager' // Added ownerRole
      };
      
      // Remove location if it's the default placeholder and not set by user
      if (payload.location && payload.location[0] === 36.8065 && payload.location[1] === 10.1815 && !newCompanyForm.locationChangedByUser) {
          // Or if newCompanyForm.location is null (if you initialize it to null and only set it on user interaction)
          // delete payload.location; // Or set to null, depending on backend requirements
      }


      const response = await axios.post('http://localhost:5001/api/companies', payload, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      // Check if the response data itself is the company object (identified by _id)
      if (response.data && response.data._id) {
        const newCompany = response.data; // Use response.data directly
        setCompanies(prevCompanies => [...prevCompanies, newCompany]);
        setCurrentCompany(newCompany); 
        setEditForm(newCompany); 
        setIsCreatingNewCompany(false);
        setNewCompanyForm({ 
          companyName: '', description: '',
          address: { street: '', city: '', state: '', zipCode: '', country: '' },
          location: null, locationChangedByUser: false,
        });
        setAddressQuery(''); // Reset address query
        setNominatimResults([]);
        success('Company created successfully');
        setShowDetails(true); // Show the new company's details/form
      } else if (response.data.company && response.data.company._id) { // Fallback for { company: { ... } } structure
        const newCompany = response.data.company;
        setCompanies(prevCompanies => [...prevCompanies, newCompany]);
        setCurrentCompany(newCompany);
        setEditForm(newCompany);
        setIsCreatingNewCompany(false);
        setNewCompanyForm({
          companyName: '', description: '',
          address: { street: '', city: '', state: '', zipCode: '', country: '' },
          location: null, locationChangedByUser: false,
        });
        setAddressQuery('');
        setNominatimResults([]);
        success('Company created successfully');
        setShowDetails(true);
      } else {
        console.error('Unexpected response format after creating company:', response.data);
        showError('Company created, but the response format was unexpected. Please refresh.');
      }
    } catch (err) {
      console.error('Error creating company:', err);
      showError(err.response?.data?.message || 'Failed to create company');
    }
  };
  
  const handleDeleteCompany = async (companyId) => {
    if (!companyId) {
      showError('No company ID provided for deletion.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/companies/${companyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setCompanies(prevCompanies => prevCompanies.filter(c => c._id !== companyId));
      if (currentCompany && currentCompany._id === companyId) {
        if (companies.length > 1) { // If there are other companies left
          const newCurrent = companies.find(c => c._id !== companyId); // Select the first available
          handleSelectCompany(newCurrent || companies[0]); // Fallback to first if find fails (should not happen)
        } else { // No other companies left
          setCurrentCompany(null);
          setEditForm({});
          // Optionally, switch to create mode if no companies are left
          // toggleCreateMode(); 
        }
      }
      success('Company deleted successfully');
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
    } catch (err) {
      console.error('Error deleting company:', err);
      showError(err.response?.data?.message || 'Failed to delete company');
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
    }
  };

  const openDeleteConfirmModal = (company) => {
    setCompanyToDelete(company);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirmModal = () => {
    setCompanyToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleEditFormInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditForm(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };
  
  const handleNewCompanyInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewCompanyForm(prev => ({ ...prev, [parent]: { ...(prev[parent] || {}), [child]: value } }));
    } else {
      setNewCompanyForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleLocationChangeShared = useCallback(async (location, formSetter, addressSetter) => {
    formSetter(prev => ({ ...prev, location: location, ...(isCreatingNewCompany && { locationChangedByUser: true }) }));

    if (location && location.length === 2) {
      setNominatimLoading(true);
      try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location[0]}&lon=${location[1]}`);
        if (response.data && response.data.address) {
          const addr = response.data.address;
          addressSetter(prev => ({
            ...prev,
            address: {
              street: addr.road || '',
              city: addr.city || addr.town || addr.village || '',
              state: addr.state || '',
              zipCode: addr.postcode || '',
              country: addr.country || ''
            }
          }));
        }
      } catch (err) {
        console.error('Error reverse geocoding:', err);
      } finally {
        setNominatimLoading(false);
      }
    }
  }, [isCreatingNewCompany]); // Dependency on isCreatingNewCompany for locationChangedByUser flag

  const handleEditFormLocationChange = useCallback((location) => {
    handleLocationChangeShared(location, setEditForm, setEditForm);
  }, [handleLocationChangeShared]);

  const handleNewCompanyFormLocationChange = useCallback((location) => {
    handleLocationChangeShared(location, setNewCompanyForm, setNewCompanyForm);
  }, [handleLocationChangeShared]);


  const handleAddressSearch = async (event) => {
    if (event) event.preventDefault();
    if (!addressQuery.trim()) {
      setNominatimResults([]);
      return;
    }
    setNominatimLoading(true);
    setNominatimResults([]);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&addressdetails=1`);
      setNominatimResults(response.data || []);
      if (!response.data || response.data.length === 0) {
        showError('No results found for the address.');
      }
    } catch (err) {
      console.error('Error searching address with Nominatim:', err);
      showError('Failed to search for address.');
    } finally {
      setNominatimLoading(false);
    }
  };

  const handleNominatimResultSelect = (result) => {
    const { lat, lon, address } = result;
    const newLocation = [parseFloat(lat), parseFloat(lon)];
    const newAddress = {
      street: address.road || '',
      city: address.city || address.town || address.village || '',
      state: address.state || '',
      zipCode: address.postcode || '',
      country: address.country || ''
    };

    if (isCreatingNewCompany) {
      setNewCompanyForm(prev => ({ ...prev, location: newLocation, address: newAddress, locationChangedByUser: true }));
    } else {
      setEditForm(prev => ({ ...prev, location: newLocation, address: newAddress }));
    }
    setAddressQuery(result.display_name);
    setNominatimResults([]);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        showError('Please select a valid image file (JPEG, PNG, or SVG)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async () => {
    if (!selectedFile || (!currentCompany && !isCreatingNewCompany) || (isCreatingNewCompany && !currentCompany?._id) ) { // Logic needs refinement if uploading for a just-created company
        showError("Cannot upload logo: No company selected or new company not yet saved.");
        return;
    }
    // This function should ideally be called for an existing company (currentCompany)
    // If used for a new company, it must be after it's created and has an ID.
    const companyIdToUploadTo = currentCompany?._id; 
    if (!companyIdToUploadTo) {
        showError("Company ID is missing for logo upload.");
        return;
    }

    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('logo', selectedFile);

      const response = await axios.post(
        `http://localhost:5001/api/companies/${companyIdToUploadTo}/upload-logo`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.company) {
        const updatedCompanyWithLogo = response.data.company;
        setCompanies(prevCompanies => prevCompanies.map(c => c._id === updatedCompanyWithLogo._id ? updatedCompanyWithLogo : c));
        if (currentCompany?._id === updatedCompanyWithLogo._id) {
            setCurrentCompany(updatedCompanyWithLogo);
            setEditForm(updatedCompanyWithLogo);
        }
        setSelectedFile(null);
        setPreviewUrl(null); // Make sure to revoke this URL if not already done
        success('Company logo updated successfully');
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      showError(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };
  
  const toggleEditMode = () => {
    if (isCreatingNewCompany) setIsCreatingNewCompany(false); // Exit create mode if active
    if (currentCompany) {
        setEditForm(currentCompany); 
        const currentCompanyAddress = currentCompany.address;
        setAddressQuery(currentCompanyAddress ? `${currentCompanyAddress.street || ''}, ${currentCompanyAddress.city || ''}`.trim().replace(/^,|,$/g,'') : '');
        setNominatimResults([]);
        setEditing(true);
        setShowDetails(true);
    } else {
        showError("Please select a company to edit.");
    }
  };

  const toggleCreateMode = () => {
    if (editing) setEditing(false); // Exit edit mode if active
    setIsCreatingNewCompany(true);
    setCurrentCompany(null); // Deselect any current company
    setNewCompanyForm({
      companyName: '', description: '',
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      location: null, locationChangedByUser: false,
    });
    setAddressQuery(''); 
    setNominatimResults([]);
    setShowDetails(true); // Ensure form is visible
  };

  const formCancelHandler = () => {
    if (isCreatingNewCompany) {
      setIsCreatingNewCompany(false);
      if (companies.length > 0) { // If companies exist, select the first one
        handleSelectCompany(companies[0]);
      } else { // No companies exist
        setCurrentCompany(null);
        setEditForm({});
      }
    } else { // Cancelling edit
      setEditing(false);
      if (currentCompany) setEditForm(currentCompany); // Reset edit form
    }
    clearFileSelection();
    setNominatimResults([]); // Clear nominatim results on cancel
    // Reset addressQuery based on the mode/selected company
    if (!isCreatingNewCompany && currentCompany && currentCompany.address) {
        setAddressQuery(`${currentCompany.address.street || ''}, ${currentCompany.address.city || ''}`.trim().replace(/^,|,$/g,''));
    } else if (isCreatingNewCompany || !currentCompany) {
        setAddressQuery('');
    }
  };

  if (loading) return <CompanySkeleton />;

  // Prepare search configuration for admin view
  const getSearchConfig = () => {
    const filters = [];
    const sortOptions = [
      { value: 'companyName', label: 'Company Name' },
      { value: 'createdAt', label: 'Date Created' },
      { value: 'ownerId.fullName', label: 'Owner Name' },
      { value: 'address.city', label: 'City' }
    ];

    // Add industry filter
    if (filterOptions.industries && filterOptions.industries.length > 0) {
      filters.push({
        key: 'industry',
        label: 'Industry',
        options: filterOptions.industries.map(industry => ({
          value: industry.value,
          label: `${industry.label} (${industry.count})`
        })),
        defaultValue: 'all'
      });
    }

    // Add status filter
    if (filterOptions.statuses && filterOptions.statuses.length > 0) {
      filters.push({
        key: 'status',
        label: 'Status',
        options: filterOptions.statuses.map(status => ({
          value: status.value,
          label: `${status.label} (${status.count})`
        })),
        defaultValue: 'all'
      });
    }

    // Add verification filter
    if (filterOptions.verificationStatus && filterOptions.verificationStatus.length > 0) {
      filters.push({
        key: 'isVerified',
        label: 'Verification',
        options: filterOptions.verificationStatus.map(verification => ({
          value: verification.value,
          label: `${verification.label} (${verification.count})`
        })),
        defaultValue: 'all'
      });
    }

    return { filters, sortOptions };
  };
  // Admin View: Render AdminCompanyTable with SearchBar
  if (currentUser && currentUser.role === 'Admin') {
    const { filters, sortOptions } = getSearchConfig();
    
    return (
      <div className="p-4 sm:p-6 bg-slate-900 min-h-screen">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Company Management</h1>
          <p className="text-slate-400">Manage and monitor all companies in the system</p>
        </div>        {isSearchEnabled && filterOptions.industries && (
          <SearchBar
            onSearch={handleSearch}
            filters={filters}
            sortOptions={sortOptions}
            placeholder="Search companies by name, description, city, or industry..."
            className="mb-6"
          />
        )}
        
        <AdminCompanyTable 
          companies={companies} 
          onApproveCompany={handleApproveCompany}
          onSuspendCompany={handleSuspendCompany}
          onDeleteCompany={handleAdminDeleteCompany} // Use the new admin-specific delete handler
        />
      </div>
    );
  }
  
  // Manager View: Existing layout (No companies screen, company selector, forms, etc.)
  if (!loading && companies.length === 0 && !isCreatingNewCompany) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
          <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Icons.Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No Companies Found</h2>
          <p className="text-slate-400 leading-relaxed mb-6">
            You haven't added any companies yet. Get started by adding your first one.
          </p>
          <button 
            onClick={toggleCreateMode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center mx-auto"
          >
            <Icons.PlusCircle className="w-5 h-5 mr-2" /> Add Your First Company
          </button>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }
  
  const formToShow = isCreatingNewCompany ? newCompanyForm : editForm;
  const formInputChangeHandler = isCreatingNewCompany ? handleNewCompanyInputChange : handleEditFormInputChange;
  const formLocationChangeHandler = isCreatingNewCompany ? handleNewCompanyFormLocationChange : handleEditFormLocationChange;
  const formSubmitHandler = isCreatingNewCompany ? handleCreateCompany : updateCompany;
  const formSubmitButtonText = isCreatingNewCompany ? "Create Company" : "Save Changes";


  return (
    <div className="p-4 sm:p-6 bg-slate-900 min-h-screen">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Conditional rendering for manager: show company selector and add new button */}
      {currentUser && currentUser.role !== 'Admin' && (
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          {companies.length > 0 && (
            <div className="flex items-center">
              <label htmlFor="company-select" className="mr-2 text-slate-300 font-medium">Select Company:</label>
              <select 
                id="company-select"
                value={currentCompany?._id || ''}
                onChange={(e) => {
                  const selected = companies.find(c => c._id === e.target.value);
                  if (selected) handleSelectCompany(selected);
                }}
                className="bg-slate-800 border border-slate-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={editing || isCreatingNewCompany}
              >
                {companies.map(comp => (
                  <option key={comp._id} value={comp._id}>{comp.companyName}</option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={toggleCreateMode}
            disabled={isCreatingNewCompany} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            <Icons.PlusCircle className="w-5 h-5 mr-2" /> Add New Company
          </button>
        </div>
      )}

      {/* Conditional rendering for manager: new company form title */}
      {currentUser && currentUser.role !== 'Admin' && isCreatingNewCompany && (
         <div className="mb-4 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Create New Company</h2>
         </div>
      )}

      {/* Conditional rendering for manager: company header */}
      { currentUser && currentUser.role !== 'Admin' && (currentCompany && !isCreatingNewCompany && !editing) && (
         <CompanyHeader 
          company={currentCompany} 
          editing={false} 
          onEdit={toggleEditMode}
          onDelete={() => openDeleteConfirmModal(currentCompany)} // Pass onDelete prop
          showDetails={showDetails} // This prop might be for the old structure
          setShowDetails={setShowDetails} // This prop might be for the old structure
        />
      )}
      
      {/* Details Toggle - only if a company is selected and not creating/editing */}
      {currentCompany && !isCreatingNewCompany && !editing && (
        <div className="border-t border-b border-slate-700 my-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center space-x-3 p-3 text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-300 group"
          >
            <span className="text-sm font-medium group-hover:text-blue-300 transition-colors">
              {showDetails ? 'Hide Company Details' : 'Show Company Details'}
            </span>
            <div className={`p-1 rounded-full transition-all duration-300 ${showDetails ? 'bg-blue-500/20' : 'bg-slate-600/30'} group-hover:bg-blue-500/30`}>
              <Icons.ChevronDown className={`w-[14px] h-[14px] transition-all duration-300 ${showDetails ? 'rotate-180 text-blue-400' : 'text-slate-400'} group-hover:text-blue-300`} />
            </div>
          </button>
        </div>
      )}


      { (editing || isCreatingNewCompany) && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 sm:p-6 mt-4">
          {editing && currentCompany && <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">Edit {currentCompany.companyName}</h2>}
          <CompanyDetailsForm
            editForm={formToShow} 
            handleInputChange={formInputChangeHandler} 
            uploadLogo={uploadLogo} 
            handleFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            uploadingLogo={uploadingLogo}
            previewUrl={previewUrl}
            clearFileSelection={clearFileSelection}
            updateCompany={formSubmitHandler} 
            company={currentCompany} 
            setEditing={formCancelHandler} // This is the cancel/back button
            handleLocationChange={formLocationChangeHandler} 
            
            addressQuery={addressQuery}
            setAddressQuery={setAddressQuery}
            handleAddressSearch={handleAddressSearch}
            nominatimResults={nominatimResults}
            handleNominatimResultSelect={handleNominatimResultSelect}
            nominatimLoading={nominatimLoading}
            isCreating={isCreatingNewCompany} 
            submitButtonText={formSubmitButtonText} // Pass the dynamic button text
          />
        </div>
      ) }

      { (!editing && !isCreatingNewCompany && currentCompany && showDetails) && (
         <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 sm:p-6 mt-4">
            <CompanyDetailsView company={currentCompany} />
         </div>
      )}
      
      { !currentCompany && !isCreatingNewCompany && companies.length > 0 && (
         <div className="text-center text-slate-400 py-10">Select a company to view its details or add a new one.</div>
      )}

      {showDeleteConfirm && companyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete the company "{companyToDelete.companyName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirmModal}
                className="px-4 py-2 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCompany(companyToDelete._id)}
                className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompanyManagement;
