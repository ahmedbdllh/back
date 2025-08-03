import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Filter, 
  AlertCircle,
  Search,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../../shared/ui/components/Button';
import { Select } from '../../../shared/ui/components/Select';
import { TextInput } from '../../../shared/ui/components/TextInput';
import LoadingSpinner from '../../../shared/ui/components/LoadingSpinner';
import ComplaintCard from '../components/ComplaintCard';
import ComplaintFormModal from '../components/ComplaintFormModal';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';
import useComplaints from '../hooks/useComplaints';

const MyComplaintsPage = () => {
  const location = useLocation();
  const { complaints, loading, error, fetchMyComplaints } = useComplaints();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    search: ''
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'court', label: 'Court Issues' },
    { value: 'booking', label: 'Booking Problems' },
    { value: 'payment', label: 'Payment Issues' },
    { value: 'staff', label: 'Staff Behavior' },
    { value: 'facility', label: 'Facility Problems' },
    { value: 'team', label: 'Team Issues' },
    { value: 'technical', label: 'Technical Problems' },
    { value: 'other', label: 'Other' }
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  useEffect(() => {
    loadComplaints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Handle success message from navigation
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const loadComplaints = async () => {
    try {
      await fetchMyComplaints(filters);
    } catch (error) {
      console.error('Failed to load complaints:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleComplaintCreated = () => {
    loadComplaints();
  };

  const handleComplaintUpdated = () => {
    loadComplaints();
    setSelectedComplaint(null);
  };

  // Calculate statistics
  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    closed: complaints.filter(c => c.status === 'closed').length
  };

  const hasUnreadReplies = complaints.some(complaint => 
    complaint.comments?.some(comment => 
      comment.authorRole !== 'Player' && !comment.isRead
    )
  );

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Complaints</h1>
            <p className="text-gray-400">
              Track and manage your submitted complaints
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="flex items-center"
          >
            <Plus size={20} className="mr-2" />
            New Complaint
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-400" size={20} />
            <p className="text-green-300">{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-green-400 hover:text-green-300"
            >
              ×
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <MessageSquare className="text-gray-400" size={24} />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Open</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.open}</p>
              </div>
              <AlertCircle className="text-yellow-400" size={24} />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
              </div>
              <Clock className="text-blue-400" size={24} />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Resolved</p>
                <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
              </div>
              <CheckCircle className="text-green-400" size={24} />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Closed</p>
                <p className="text-2xl font-bold text-gray-400">{stats.closed}</p>
              </div>
              <TrendingUp className="text-gray-400" size={24} />
            </div>
          </div>
        </div>

        {/* Unread Replies Alert */}
        {hasUnreadReplies && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="text-blue-400 mr-3" size={20} />
              <div>
                <p className="text-blue-300 font-medium">You have new replies!</p>
                <p className="text-blue-200 text-sm">Check your complaints for responses from our team.</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-4">
            <Filter size={18} className="text-gray-400 mr-2" />
            <span className="text-white font-medium">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <TextInput
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search complaints..."
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={statuses}
            />

            {/* Category Filter */}
            <Select
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
              options={categories}
            />

            {/* Priority Filter */}
            <Select
              value={filters.priority}
              onChange={(value) => handleFilterChange('priority', value)}
              options={priorities}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle size={18} className="text-red-400 mr-2" />
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Complaints List */}
        {loading && complaints.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg">
            <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No complaints found</h3>
            <p className="text-gray-500 mb-4">
              {Object.values(filters).some(f => f !== 'all' && f !== '')
                ? "Try adjusting your filters to see more results."
                : "You haven't submitted any complaints yet."
              }
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
            >
              Submit Your First Complaint
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint._id}
                complaint={complaint}
                onView={handleViewComplaint}
                showSubmittedBy={false}
                showActions={true}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <ComplaintFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleComplaintCreated}
        />

        {selectedComplaint && (
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
            onUpdate={handleComplaintUpdated}
            userRole="Player"
          />
        )}
      </div>
    </div>
  );
};

export default MyComplaintsPage;
