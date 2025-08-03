import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '../../../shared/ui/components/Button';
import { TextInput } from '../../../shared/ui/components/TextInput';
import { Select } from '../../../shared/ui/components/Select';
import { Container } from '../../../shared/ui/components/Container';
import useComplaints from '../hooks/useComplaints';

const CreateComplaintPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { createComplaint, loading } = useComplaints();
  
  // Get prefilled data from navigation state
  const relatedTo = location.state?.relatedTo;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: relatedTo?.type === 'court' ? 'court' : 'other',
    priority: 'medium'
  });
  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'court', label: 'Court Issues' },
    { value: 'booking', label: 'Booking Problems' },
    { value: 'payment', label: 'Payment Issues' },
    { value: 'staff', label: 'Staff Behavior' },
    { value: 'facility', label: 'Facility Problems' },
    { value: 'team', label: 'Team Issues' },
    { value: 'technical', label: 'Technical Problems' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleInputChange = (field, value) => {
    const actualValue = value?.target ? value.target.value : value;
    setFormData(prev => ({ ...prev, [field]: actualValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const complaintData = {
        ...formData,
        relatedTo: relatedTo || null
      };

      await createComplaint(complaintData);
      navigate('/my-complaints', { 
        state: { 
          message: 'Complaint submitted successfully! We will review it shortly.' 
        }
      });
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Container className="py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Submit a Complaint</h1>
            <p className="text-white/70 mt-1">
              {relatedTo ? `Reporting issue with ${relatedTo.referenceName}` : 'Tell us about your concern'}
            </p>
          </div>
        </div>

        {/* Related Information */}
        {relatedTo && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-blue-400" size={20} />
              <div>
                <p className="text-blue-300 font-medium">
                  {relatedTo.type === 'court' ? 'Court Information' : 'Related Information'}
                </p>
                <p className="text-white/70 text-sm">
                  <strong>{relatedTo.referenceName}</strong>
                  {relatedTo.location && (
                    <span> - {relatedTo.location.address}, {relatedTo.location.city}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="text-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Complaint Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <TextInput
                label="Complaint Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e)}
                placeholder="Brief summary of your complaint"
                error={errors.title}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e)}
                  options={categories}
                  error={errors.category}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div>
                <Select
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e)}
                  options={priorities}
                  error={errors.priority}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e)}
                placeholder="Please provide detailed information about your complaint..."
                rows={6}
                className={`w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm resize-none ${errors.description ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
};

export default CreateComplaintPage;
