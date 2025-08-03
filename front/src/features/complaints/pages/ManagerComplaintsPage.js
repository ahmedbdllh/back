import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Filter, 
  AlertCircle,
  Search,
  Clock,
  CheckCircle,
  Building,
  Plus,
  Brain,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Select } from '../../../shared/ui/components/Select';
import { TextInput } from '../../../shared/ui/components/TextInput';
import { Button } from '../../../shared/ui/components/Button';
import LoadingSpinner from '../../../shared/ui/components/LoadingSpinner';
import ComplaintCard from '../components/ComplaintCard';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';
import ComplaintFormModal from '../components/ComplaintFormModal';
import useComplaints from '../hooks/useComplaints';
import Sidebar from '../../../core/layout/Sidebar';

const ManagerComplaintsPage = () => {
  const { complaints, loading, error, fetchComplaints } = useComplaints();
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiInsights, setAiInsights] = useState({
    categorySuggestions: {},
    sentimentAnalysis: {},
    priorityRecommendations: {}
  });
  const [aiEnabled, setAiEnabled] = useState(true);
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
    { value: 'facility', label: 'Facility Problems' },
    { value: 'payment', label: 'Payment Issues' },
    { value: 'staff', label: 'Staff Behavior' },
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
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  // AI Analysis Functions
  const analyzeComplaintSentiment = (description) => {
    // Simple sentiment analysis based on keywords
    const negativeWords = ['terrible', 'awful', 'horrible', 'disgusting', 'worst', 'hate', 'angry', 'furious', 'frustrated', 'unacceptable', 'disappointed'];
    const urgentWords = ['urgent', 'immediately', 'asap', 'emergency', 'critical', 'serious', 'dangerous', 'broken', 'not working'];
    const positiveWords = ['good', 'great', 'excellent', 'satisfied', 'happy', 'pleased', 'thank'];
    
    const text = description.toLowerCase();
    
    const negativeScore = negativeWords.filter(word => text.includes(word)).length;
    const urgentScore = urgentWords.filter(word => text.includes(word)).length;
    const positiveScore = positiveWords.filter(word => text.includes(word)).length;
    
    let sentiment = 'neutral';
    let urgency = 'medium';
    let emotionalIntensity = 'moderate';
    
    if (negativeScore > positiveScore) {
      sentiment = negativeScore >= 3 ? 'very_negative' : 'negative';
      emotionalIntensity = negativeScore >= 3 ? 'high' : 'moderate';
    } else if (positiveScore > negativeScore) {
      sentiment = 'positive';
      emotionalIntensity = 'low';
    }
    
    if (urgentScore >= 2) {
      urgency = 'high';
    } else if (urgentScore >= 1) {
      urgency = 'medium';
    }
    
    return {
      sentiment,
      urgency,
      emotionalIntensity,
      suggestedPriority: urgentScore >= 2 || negativeScore >= 3 ? 'urgent' : 
                        urgentScore >= 1 || negativeScore >= 2 ? 'high' : 'medium',
      confidence: Math.min(90, 60 + (negativeScore + urgentScore + positiveScore) * 10)
    };
  };

  const categorizeComplaint = (description) => {
    // Auto-categorization based on keywords
    const categoryKeywords = {
      court: ['court', 'field', 'surface', 'net', 'lighting', 'floor', 'equipment', 'racket', 'ball'],
      booking: ['booking', 'reservation', 'schedule', 'time slot', 'availability', 'cancel', 'reschedule'],
      facility: ['locker', 'shower', 'bathroom', 'parking', 'entrance', 'cleanliness', 'temperature', 'air conditioning'],
      payment: ['payment', 'refund', 'charge', 'billing', 'credit card', 'money', 'fee', 'cost', 'price'],
      staff: ['staff', 'employee', 'manager', 'service', 'rude', 'helpful', 'attitude', 'behavior'],
      technical: ['app', 'website', 'system', 'login', 'password', 'bug', 'error', 'not working']
    };
    
    const text = description.toLowerCase();
    const scores = {};
    
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      scores[category] = keywords.filter(keyword => text.includes(keyword)).length;
    });
    
    const bestCategory = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
    const confidence = Math.min(95, 40 + bestCategory[1] * 15);
    
    return {
      suggestedCategory: bestCategory[1] > 0 ? bestCategory[0] : 'other',
      confidence,
      alternativeCategories: Object.entries(scores)
        .filter(([cat, score]) => score > 0 && cat !== bestCategory[0])
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([cat]) => cat)
    };
  };

  const generateAIInsights = () => {
    const insights = {
      categorySuggestions: {},
      sentimentAnalysis: {},
      priorityRecommendations: {}
    };
    
    complaints.forEach(complaint => {
      if (complaint.description) {
        const sentiment = analyzeComplaintSentiment(complaint.description);
        const category = categorizeComplaint(complaint.description);
        
        insights.sentimentAnalysis[complaint._id] = sentiment;
        insights.categorySuggestions[complaint._id] = category;
        
        // Priority recommendations based on AI analysis
        if (sentiment.urgency === 'high' || sentiment.sentiment === 'very_negative') {
          insights.priorityRecommendations[complaint._id] = {
            suggested: 'urgent',
            reason: sentiment.urgency === 'high' ? 'Contains urgent keywords' : 'Very negative sentiment detected'
          };
        }
      }
    });
    
    setAiInsights(insights);
  };

  useEffect(() => {
    if (complaints.length > 0 && aiEnabled) {
      generateAIInsights();
    }
  }, [complaints, aiEnabled]);

  useEffect(() => {
    loadComplaints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadComplaints = async () => {
    try {
      await fetchComplaints(filters);
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
    needingResponse: complaints.filter(c => 
      (c.status === 'open' || c.status === 'in-progress') &&
      (!c.comments || c.comments.length === 0 || 
       c.comments[c.comments.length - 1]?.authorRole === 'Player')
    ).length
  };

  // Filter complaints that need manager attention (court/booking/facility related)
  const managerRelevantComplaints = complaints.filter(complaint => 
    ['court', 'booking', 'facility', 'payment'].includes(complaint.category)
  );

  const urgentComplaints = complaints.filter(c => 
    c.priority === 'urgent' && (c.status === 'open' || c.status === 'in-progress')
  );

  return (
    <div className="flex">
      <Sidebar onCollapseChange={setSidebarCollapsed} />
      <div 
        className={`flex-1 min-h-screen bg-slate-900 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16 sm:ml-20' : 'ml-72 sm:ml-80'
        }`}
      >
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Complaints Management</h1>
            <p className="text-gray-400">
              Manage complaints related to your facilities and services
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setAiEnabled(!aiEnabled)}
              variant={aiEnabled ? "primary" : "secondary"}
              className={`flex items-center gap-2 ${aiEnabled ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
            >
              <Brain size={16} />
              AI {aiEnabled ? 'ON' : 'OFF'}
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create Complaint
            </Button>
            <div className="text-right">
              <div className="text-sm text-gray-400">Manager Dashboard</div>
              <div className="text-white font-medium">Court & Facility Complaints</div>
            </div>
          </div>
        </div>

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

          <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Needing Response</p>
                <p className="text-2xl font-bold text-red-400">{stats.needingResponse}</p>
              </div>
              <AlertCircle className="text-red-400" size={24} />
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
                <p className="text-gray-400 text-sm">Facility Related</p>
                <p className="text-2xl font-bold text-purple-400">{managerRelevantComplaints.length}</p>
              </div>
              <Building className="text-purple-400" size={24} />
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        {aiEnabled && (
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <Brain className="text-purple-400 mr-3" size={24} />
              <h2 className="text-xl font-bold text-white">🤖 AI Insights & Analysis</h2>
              <span className="ml-auto text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
                BETA
              </span>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sentiment Analysis */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <TrendingUp className="text-blue-400 mr-2" size={18} />
                <h3 className="text-blue-400 font-medium">Sentiment Analysis</h3>
              </div>
              {complaints.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Very Negative:</span>
                    <span className="text-red-400">
                      {Object.values(aiInsights.sentimentAnalysis).filter(s => s.sentiment === 'very_negative').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Negative:</span>
                    <span className="text-orange-400">
                      {Object.values(aiInsights.sentimentAnalysis).filter(s => s.sentiment === 'negative').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Neutral:</span>
                    <span className="text-gray-400">
                      {Object.values(aiInsights.sentimentAnalysis).filter(s => s.sentiment === 'neutral').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Positive:</span>
                    <span className="text-green-400">
                      {Object.values(aiInsights.sentimentAnalysis).filter(s => s.sentiment === 'positive').length}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No data to analyze</p>
              )}
            </div>

            {/* Auto-Categorization */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Zap className="text-yellow-400 mr-2" size={18} />
                <h3 className="text-yellow-400 font-medium">Auto-Categorization</h3>
              </div>
              {complaints.length > 0 ? (
                <div className="space-y-2">
                  {['court', 'booking', 'facility', 'payment', 'staff', 'technical'].map(cat => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{cat}:</span>
                      <span className="text-blue-400">
                        {Object.values(aiInsights.categorySuggestions).filter(c => c.suggestedCategory === cat).length}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No data to analyze</p>
              )}
            </div>

            {/* Priority Recommendations */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <AlertCircle className="text-red-400 mr-2" size={18} />
                <h3 className="text-red-400 font-medium">Priority Suggestions</h3>
              </div>
              {Object.keys(aiInsights.priorityRecommendations).length > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">AI Suggested Urgent:</span>
                    <span className="text-red-400">
                      {Object.values(aiInsights.priorityRecommendations).filter(p => p.suggested === 'urgent').length}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Based on sentiment & urgency keywords
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No urgent patterns detected</p>
              )}
            </div>
          </div>
          
          {/* AI Recommendations */}
          {Object.keys(aiInsights.priorityRecommendations).length > 0 && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 text-sm font-medium">💡 AI Recommendation:</p>
              <p className="text-yellow-200 text-xs mt-1">
                {Object.keys(aiInsights.priorityRecommendations).length} complaints have been flagged for priority review based on sentiment analysis and urgency keywords.
              </p>
            </div>
          )}
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
            <p className="text-gray-500">
              {Object.values(filters).some(f => f !== 'all' && f !== '')
                ? "Try adjusting your filters to see more results."
                : "No complaints have been submitted yet."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Urgent Complaints Section */}
            {urgentComplaints.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center">
                  <AlertCircle className="mr-2" size={24} />
                  Urgent Complaints ({urgentComplaints.length})
                </h2>
                <div className="grid gap-4">
                  {urgentComplaints.map((complaint) => (
                    <div key={complaint._id} className="border-l-4 border-red-500 relative">
                      {/* AI Analysis Badge */}
                      {aiEnabled && aiInsights.sentimentAnalysis[complaint._id] && (
                        <div className="absolute top-2 right-2 z-10 flex gap-1">
                          {aiInsights.sentimentAnalysis[complaint._id].sentiment === 'very_negative' && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                              <Brain size={10} className="mr-1" />
                              Very Negative
                            </span>
                          )}
                          {aiInsights.priorityRecommendations[complaint._id] && (
                            <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full flex items-center">
                              <Zap size={10} className="mr-1" />
                              AI: {aiInsights.priorityRecommendations[complaint._id].suggested}
                            </span>
                          )}
                          {aiInsights.categorySuggestions[complaint._id] && aiInsights.categorySuggestions[complaint._id].confidence > 70 && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                              <TrendingUp size={10} className="mr-1" />
                              {aiInsights.categorySuggestions[complaint._id].suggestedCategory}
                            </span>
                          )}
                        </div>
                      )}
                      <ComplaintCard
                        complaint={complaint}
                        onView={handleViewComplaint}
                        showSubmittedBy={true}
                        showActions={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Complaints */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <MessageSquare className="mr-2" size={24} />
                All Complaints ({complaints.length})
              </h2>
              <div className="grid gap-4">
                {complaints.map((complaint) => (
                  <div key={complaint._id} className="relative">
                    {/* AI Analysis Badges */}
                    {aiEnabled && aiInsights.sentimentAnalysis[complaint._id] && (
                      <div className="absolute top-2 right-2 z-10 flex gap-1 flex-wrap">
                        {/* Sentiment Badge */}
                        {aiInsights.sentimentAnalysis[complaint._id].sentiment !== 'neutral' && (
                          <span className={`text-white text-xs px-2 py-1 rounded-full flex items-center ${
                            aiInsights.sentimentAnalysis[complaint._id].sentiment === 'very_negative' ? 'bg-red-600' :
                            aiInsights.sentimentAnalysis[complaint._id].sentiment === 'negative' ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}>
                            <Brain size={10} className="mr-1" />
                            {aiInsights.sentimentAnalysis[complaint._id].sentiment.replace('_', ' ')}
                          </span>
                        )}
                        
                        {/* Priority Recommendation Badge */}
                        {aiInsights.priorityRecommendations[complaint._id] && (
                          <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full flex items-center">
                            <Zap size={10} className="mr-1" />
                            AI: {aiInsights.priorityRecommendations[complaint._id].suggested}
                          </span>
                        )}
                        
                        {/* Category Suggestion Badge */}
                        {aiInsights.categorySuggestions[complaint._id] && 
                         aiInsights.categorySuggestions[complaint._id].confidence > 70 && 
                         aiInsights.categorySuggestions[complaint._id].suggestedCategory !== complaint.category && (
                          <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <TrendingUp size={10} className="mr-1" />
                            Suggest: {aiInsights.categorySuggestions[complaint._id].suggestedCategory}
                          </span>
                        )}
                        
                        {/* High Confidence Badge */}
                        {aiInsights.categorySuggestions[complaint._id] && 
                         aiInsights.categorySuggestions[complaint._id].confidence > 85 && (
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <Brain size={10} className="mr-1" />
                            {aiInsights.categorySuggestions[complaint._id].confidence}% confident
                          </span>
                        )}
                      </div>
                    )}
                    
                    <ComplaintCard
                      key={complaint._id}
                      complaint={complaint}
                      onView={handleViewComplaint}
                      showSubmittedBy={true}
                      showActions={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Complaint Details Modal */}
        {selectedComplaint && (
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
            onUpdate={handleComplaintUpdated}
            userRole="Manager"
          />
        )}

        {/* Create Complaint Modal */}
        <ComplaintFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchComplaints(filters);
          }}
        />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerComplaintsPage;
