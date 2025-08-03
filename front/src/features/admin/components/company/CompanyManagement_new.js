import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { useToast, ToastContainer } from '../../../ui/Toast';
import axios from 'axios';
import CompanyHeader from './CompanyHeader';
import CompanyDetailsForm from './CompanyDetailsForm';
import CompanyDetailsView from './CompanyDetailsView';
import CompanySkeleton from './CompanySkeleton';

const CompanyManagement = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toasts, removeToast, success, error: showError } = useToast();

  // Get current user info
  const getCurrentUser = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Fetch company data
  const fetchCompany = async () => {
    try {
      setLoading(true);
      const user = getCurrentUser();
      console.log('Current user from JWT:', user);
      
      if (!user) {
        showError('User not authenticated');
        return;
      }

      const token = localStorage.getItem('token');
      console.log('Making request to:', `http://localhost:5001/api/companies/owner/${user.id}`);
      
      const response = await axios.get(`http://localhost:5001/api/companies/owner/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Company response:', response.data);

      if (response.data && response.data.length > 0) {
        setCompany(response.data[0]); // Get the first company
        setEditForm(response.data[0]);
        console.log('Company found:', response.data[0]);
      } else {
        // No company found - this shouldn't happen if auto-creation works
        console.log('No companies found for user ID:', user.id);
        showError('No company found for this manager');
      }
    } catch (err) {
      console.error('Error fetching company:', err);
      console.error('Error response:', err.response);
      showError(err.response?.data?.message || 'Failed to fetch company information');
    } finally {
      setLoading(false);
    }
  };

  // Update company
  const updateCompany = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentUser = getCurrentUser();
      
      // Ensure all address fields are present for backend validation
      const address = editForm.address || {};
      const completeAddress = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || ''
      };
      
      // Remove ownerId from payload to prevent accidental overwrite
      const { ownerId, ...safeEditForm } = editForm;
      const payload = {
        ...safeEditForm,
        address: completeAddress
      };
      
      const response = await axios.put(`http://localhost:5001/api/companies/${company._id}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.company) {
        // Update both company state and edit form to keep them in sync
        setCompany(response.data.company);
        setEditForm(response.data.company);
        setEditing(false);
        success('Company information updated successfully');
      }
    } catch (err) {
      console.error('Error updating company:', err);
      if (err.response) {
        console.error('Backend error response:', err.response.data);
        console.error('Status code:', err.response.status);
      }
      showError(err.response?.data?.message || 'Failed to update company information');
    }
  };

  // Handle form changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle location change from map
  const handleLocationChange = (location) => {
    setEditForm(prev => ({
      ...prev,
      location: location
    }));
  };

  // Handle file selection for logo upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        showError('Please select a valid image file (JPEG, PNG, or SVG)');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Upload logo file
  const uploadLogo = async () => {
    if (!selectedFile) return;

    try {
      setUploadingLogo(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('logo', selectedFile);

      const response = await axios.post(
        `http://localhost:5001/api/companies/${company._id}/upload-logo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.company) {
        setCompany(response.data.company);
        setEditForm(response.data.company);
        setSelectedFile(null);
        setPreviewUrl(null);
        success('Company logo updated successfully');
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      showError(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  if (loading) {
    return <CompanySkeleton />;
  }
  
  if (!company) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Building2 size={32} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No Company Found</h2>
          <p className="text-slate-400 leading-relaxed">
            No company information is available for your account. Please contact support to get your company set up.
          </p>
          <div className="mt-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Contact Support
            </button>
          </div>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Company Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
        {/* Company Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 sm:p-6 border-b border-slate-700">
          <CompanyHeader
            company={company}
            editing={editing}
            onEdit={() => setEditing(true)}
            onSave={updateCompany}
            onCancel={() => {
              setEditing(false);
              setEditForm(company);
              clearFileSelection();
            }}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            uploadingLogo={uploadingLogo}
            uploadLogo={uploadLogo}
            clearFileSelection={clearFileSelection}
            setEditing={setEditing}
          />
        </div>
        {/* Show Details Toggle */}
        <div className="border-t border-slate-700">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center space-x-3 p-4 text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-300 group"
          >
            <span className="text-sm font-medium group-hover:text-blue-300 transition-colors">
              {showDetails ? 'Hide Company Details' : 'Show Company Details'}
            </span>
            <div className={`p-1 rounded-full transition-all duration-300 ${showDetails ? 'bg-blue-500/20' : 'bg-slate-600/30'} group-hover:bg-blue-500/30`}>
              <ChevronDown
                size={14}
                className={`transition-all duration-300 ${showDetails ? 'rotate-180 text-blue-400' : 'text-slate-400'} group-hover:text-blue-300`}
              />
            </div>
          </button>
        </div>
        {/* Company Details */}
        {showDetails && (
          <div className="border-t border-slate-700 bg-gradient-to-b from-slate-900/30 to-slate-900/10 animate-in slide-in-from-top-2 duration-300">
            <div className="p-6">
              {editing ? (
                <CompanyDetailsForm
                  editForm={editForm}
                  handleInputChange={handleInputChange}
                  uploadLogo={uploadLogo}
                  handleFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  uploadingLogo={uploadingLogo}
                  previewUrl={previewUrl}
                  clearFileSelection={clearFileSelection}
                  updateCompany={updateCompany}
                  company={company}
                  setEditing={setEditing}
                  handleLocationChange={handleLocationChange}
                />
              ) : (
                <CompanyDetailsView company={company} />
              )}
            </div>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default CompanyManagement;
