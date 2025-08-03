import React, { useState } from 'react';
import { X, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '../../../shared/ui/components/Button';
import { TextInput } from '../../../shared/ui/components/TextInput';
import { Select } from '../../../shared/ui/components/Select';
import useComplaints from '../hooks/useComplaints';

const ComplaintFormModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  relatedTo = null, // { type: 'court', referenceId: '123', referenceName: 'Court A' }
  prefilledCategory = null 
}) => {
  const { createComplaint, loading } = useComplaints();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: prefilledCategory || 'other',
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
    // Handle both direct values and event objects
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
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const complaintData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority
      };

      // Only add relatedTo if it exists and has required fields
      if (relatedTo && relatedTo.type) {
        complaintData.relatedTo = {
          type: relatedTo.type,
          referenceId: relatedTo.referenceId,
          referenceName: relatedTo.referenceName
        };
      }

      console.log('Submitting complaint:', complaintData);
      await createComplaint(complaintData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: prefilledCategory || 'other',
        priority: 'medium'
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error is handled by the hook
      console.error('Failed to submit complaint:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Submit Complaint</h3>
              {relatedTo && (
                <p className="text-sm text-gray-400 mt-1">
                  Related to: {relatedTo.referenceName} ({relatedTo.type})
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">
                Title *
              </label>
              <TextInput
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Brief description of the issue"
                maxLength={200}
                error={errors.title}
                className="w-full"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {formData.title.length}/200
              </div>
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Category *
                </label>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  options={categories}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Priority
                </label>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  options={priorities}
                  className="w-full"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description of the issue..."
                rows={6}
                maxLength={2000}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-slate-600'
                }`}
              />
              {errors.description && (
                <div className="flex items-center mt-1 text-red-400 text-sm">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.description}
                </div>
              )}
              <div className="text-right text-xs text-gray-400 mt-1">
                {formData.description.length}/2000
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start">
                <MessageSquare size={18} className="text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-300">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ul className="space-y-1 text-blue-300/80">
                    <li>• Your complaint will be reviewed by our team</li>
                    <li>• You'll receive updates on the status</li>
                    <li>• Response time: Usually within 24-48 hours</li>
                    <li>• You can track progress in "My Complaints"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex-1"
            >
              Submit Complaint
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintFormModal;
