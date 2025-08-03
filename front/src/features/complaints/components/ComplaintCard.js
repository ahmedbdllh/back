import React from 'react';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { Card } from '../../../shared/ui/components/Card';
import { Button } from '../../../shared/ui/components/Button';

const ComplaintCard = ({ 
  complaint, 
  onView, 
  showSubmittedBy = false, 
  showActions = true 
}) => {
  const getStatusDisplay = (status) => {
    const statusConfig = {
      'open': {
        color: 'bg-yellow-500/80 text-yellow-100',
        icon: <AlertCircle size={14} className="mr-1.5" />,
        text: 'Open'
      },
      'in-progress': {
        color: 'bg-blue-500/80 text-blue-100',
        icon: <Clock size={14} className="mr-1.5" />,
        text: 'In Progress'
      },
      'resolved': {
        color: 'bg-green-500/80 text-green-100',
        icon: <CheckCircle size={14} className="mr-1.5" />,
        text: 'Resolved'
      },
      'closed': {
        color: 'bg-gray-500/80 text-gray-100',
        icon: <XCircle size={14} className="mr-1.5" />,
        text: 'Closed'
      }
    };
    return statusConfig[status] || statusConfig['open'];
  };

  const getPriorityColor = (priority) => {
    const priorityColors = {
      'low': 'text-green-400',
      'medium': 'text-yellow-400',
      'high': 'text-orange-400',
      'urgent': 'text-red-400'
    };
    return priorityColors[priority] || 'text-gray-400';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'court': <Building size={16} />,
      'booking': <Calendar size={16} />,
      'payment': <MessageSquare size={16} />,
      'staff': <User size={16} />,
      'facility': <Building size={16} />,
      'team': <User size={16} />,
      'technical': <MessageSquare size={16} />,
      'other': <MessageSquare size={16} />
    };
    return icons[category] || icons['other'];
  };

  const statusDisplay = getStatusDisplay(complaint.status);
  const hasUnreadReplies = complaint.comments?.some(comment => 
    comment.authorRole !== 'Player' && !comment.isRead
  );

  return (
    <Card className="p-4 hover:bg-slate-700/50 transition-colors">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate" title={complaint.title}>
              {complaint.title}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-slate-400 font-mono">
                #{complaint._id.slice(-6).toUpperCase()}
              </span>
              {hasUnreadReplies && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  New Reply
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusDisplay.color}`}>
              {statusDisplay.icon}
              {statusDisplay.text}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-gray-300 line-clamp-2">
          {complaint.description}
        </div>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            {/* Category */}
            <div className="flex items-center space-x-1">
              {getCategoryIcon(complaint.category)}
              <span className="capitalize">{complaint.category}</span>
            </div>
            
            {/* Priority */}
            <div className="flex items-center space-x-1">
              <span className={`font-medium capitalize ${getPriorityColor(complaint.priority)}`}>
                {complaint.priority}
              </span>
            </div>

            {/* Comments count */}
            {complaint.comments?.length > 0 && (
              <div className="flex items-center space-x-1">
                <MessageSquare size={12} />
                <span>{complaint.comments.length}</span>
              </div>
            )}
          </div>

          {/* Date */}
          <span>
            {new Date(complaint.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Submitted by (for managers/admins) */}
        {showSubmittedBy && complaint.submittedBy && (
          <div className="text-xs text-gray-400 border-t border-slate-600 pt-2">
            <div className="flex items-center space-x-1">
              <User size={12} />
              <span>
                {complaint.submittedBy.userName} ({complaint.submittedBy.userRole})
              </span>
            </div>
          </div>
        )}

        {/* Related to */}
        {complaint.relatedTo?.referenceName && (
          <div className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
            Related to: {complaint.relatedTo.referenceName} ({complaint.relatedTo.type})
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t border-slate-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView?.(complaint)}
              className="flex-1 text-blue-400 hover:text-blue-300"
            >
              <Eye size={16} className="mr-1" />
              View Details
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ComplaintCard;
