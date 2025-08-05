import React, { useState, useEffect } from 'react';
import DataTable from '../../../../shared/ui/components/DataTable';
import SearchBar from '../../../../shared/ui/components/SearchBar';
import Pagination from '../../../../shared/ui/components/Pagination';
import { Button } from '../../../../shared/ui/components/Button';
import { Select } from '../../../../shared/ui/components/Select';
import ComplaintDetailsModal from '../../../complaints/components/ComplaintDetailsModal';
import useComplaints from '../../../complaints/hooks/useComplaints';
import { useToast, ToastContainer } from '../../../../shared/ui/components/Toast';
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, Eye, MessageSquare, Calendar, User, Settings } from 'lucide-react';

const ComplaintManagement = () => {
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  });
  
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  const { toasts, removeToast, success, error: showError } = useToast();
  
  const {
    complaints,
    error,
    fetchComplaints,
    updateComplaintStatus
  } = useComplaints();

  useEffect(() => {
    fetchComplaints(filters);
    setLoading(false);
  }, [filters]);

  const handleSearch = (searchParams) => {
    setFilters(prev => ({
      ...prev,
      search: searchParams.query || '',
      status: searchParams.status || '',
      category: searchParams.category || '',
      priority: searchParams.priority || ''
    }));
    setCurrentPage(1);
  };

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await updateComplaintStatus(complaintId, newStatus);
      fetchComplaints(filters);
      success('Complaint status updated successfully');
    } catch (error) {
      showError('Failed to update complaint status');
    }
  };

  // Status Dropdown Component
  const StatusDropdown = ({ complaint }) => {
    const [isChanging, setIsChanging] = useState(false);
    
    const statusOptions = [
      { value: 'open', label: 'Open' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'closed', label: 'Closed' }
    ];

    const handleStatusChange = async (newStatus) => {
      if (newStatus === complaint.status || isChanging) return;
      
      setIsChanging(true);
      try {
        await updateComplaintStatus(complaint._id, newStatus);
        success(`Complaint status updated to ${newStatus}`);
        // Refresh the complaints list
        await fetchComplaints(filters);
      } catch (error) {
        showError(`Failed to update status: ${error.message}`);
      } finally {
        setIsChanging(false);
      }
    };

    return (
      <div className="relative" style={{ minWidth: '120px' }}>
        {isChanging && (
          <div className="absolute inset-0 bg-slate-800/50 rounded-md flex items-center justify-center z-10">
            <RefreshCw size={14} className="animate-spin text-sky-400" />
          </div>
        )}
        <Select
          value={complaint.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          options={statusOptions}
          disabled={isChanging}
          className="w-full h-8 text-xs bg-slate-700 border-slate-600 text-slate-200"
        />
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      low: 'bg-green-500/80',
      medium: 'bg-yellow-500/80',
      high: 'bg-orange-500/80',
      urgent: 'bg-red-500/80'
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${priorityColors[priority] || 'bg-gray-500/80'}`}>
        {priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Medium'}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      open: 'bg-red-500/80',
      'in-progress': 'bg-yellow-500/80',
      resolved: 'bg-green-500/80',
      closed: 'bg-gray-500/80'
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${statusColors[status] || 'bg-gray-500/80'}`}>
        {getStatusIcon(status)}
        <span className="ml-1.5">{status?.charAt(0).toUpperCase() + status?.slice(1) || 'Open'}</span>
      </span>
    );
  };

  // Search filters configuration
  const searchFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      options: [
        { value: 'booking', label: 'Booking' },
        { value: 'court', label: 'Court' },
        { value: 'payment', label: 'Payment' },
        { value: 'staff', label: 'Staff' },
        { value: 'facility', label: 'Facility' },
        { value: 'team', label: 'Team' },
        { value: 'technical', label: 'Technical' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]
    }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' }
  ];

  // Define columns for DataTable
  const columns = [
    {
      Header: 'Title',
      accessor: 'title',
      Cell: ({ value, row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-100">{value}</span>
          <span className="text-xs text-slate-400 capitalize">{row.category}</span>
        </div>
      ),
    },
    {
      Header: 'Submitted By',
      accessor: 'submittedBy',
      Cell: ({ value }) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-blue-400" />
          <div className="flex flex-col">
            <span className="text-slate-300">{value?.userName || 'Unknown'}</span>
            <span className="text-xs text-slate-400 capitalize">{value?.userRole || 'Unknown'}</span>
          </div>
        </div>
      ),
    },
    {
      Header: 'Priority',
      accessor: 'priority',
      Cell: ({ value }) => getPriorityBadge(value),
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => getStatusBadge(value),
    },
    {
      Header: 'Date Created',
      accessor: 'createdAt',
      Cell: ({ value }) => (
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-slate-300">{formatDate(value)}</span>
        </div>
      ),
    },
    {
      Header: 'Comments',
      accessor: 'comments',
      Cell: ({ value }) => (
        <div className="flex items-center gap-1">
          <MessageSquare size={14} className="text-gray-400" />
          <span className="text-slate-300">{value?.length || 0}</span>
        </div>
      ),
    },
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {/* Status Dropdown */}
          <StatusDropdown complaint={row} />
          
          {/* View Details Button */}
          <button
            onClick={() => handleComplaintClick(row)}
            className="text-sky-400 hover:text-sky-300 transition-colors p-1 rounded-md hover:bg-sky-500/10"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  // Pagination
  const totalPages = Math.ceil((complaints?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentComplaints = complaints?.slice(startIndex, endIndex) || [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="p-6 bg-[#0F172A] rounded-lg shadow-md">
        <div className="text-red-400 text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Complaints</h3>
          <p className="mb-4">{error}</p>
          <Button onClick={() => fetchComplaints(filters)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 bg-[#0F172A] rounded-lg shadow-md">
        {/* Advanced Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          filters={searchFilters}
          sortOptions={sortOptions}
          placeholder="Search complaints by title, description, or user..."
          className="mb-6"
        />

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading complaints...</p>
          </div>
        ) : currentComplaints.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No complaints found</h3>
            <p className="text-gray-500">
              {filters.search || filters.status || filters.category || filters.priority
                ? "Try adjusting your search filters to see more results." 
                : "No complaints have been submitted yet."}
            </p>
          </div>
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={currentComplaints} 
              itemsPerPage={itemsPerPage}
            />
            
            {/* Pagination */}
            {complaints.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={complaints.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                className="mt-6"
              />
            )}
          </>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedComplaint && (
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedComplaint(null);
            }}
            onUpdate={() => {
              fetchComplaints(filters);
              setShowDetailsModal(false);
              setSelectedComplaint(null);
              success('Complaint updated successfully');
            }}
          />
        )}
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default ComplaintManagement;
