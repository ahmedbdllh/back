const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Complaint description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Complaint category is required'],
    enum: {
      values: ['booking', 'court', 'payment', 'staff', 'facility', 'team', 'technical', 'other'],
      message: 'Invalid complaint category'
    }
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Invalid priority level'
    },
    default: 'medium'
  },
  status: {
    type: String,
    enum: {
      values: ['open', 'in-progress', 'resolved', 'closed'],
      message: 'Invalid status'
    },
    default: 'open'
  },
  submittedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required']
    },
    userName: {
      type: String,
      required: [true, 'User name is required']
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required']
    },
    userRole: {
      type: String,
      enum: ['player', 'manager', 'admin'],
      required: [true, 'User role is required']
    }
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['booking', 'court', 'team', 'company', 'user', 'general'],
      default: 'general'
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    referenceName: {
      type: String,
      default: null
    },
    // Company information for court-related complaints
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Company'
    },
    companyName: {
      type: String,
      default: null
    },
    // Location information for court complaints
    location: {
      address: { type: String, default: null },
      city: { type: String, default: null }
    }
  },
  assignedTo: {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    adminName: {
      type: String,
      default: null
    },
    assignedAt: {
      type: Date,
      default: null
    }
  },
  resolution: {
    description: {
      type: String,
      default: null,
      maxlength: [1000, 'Resolution description cannot exceed 1000 characters']
    },
    resolvedBy: {
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      adminName: {
        type: String,
        default: null
      }
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    satisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      feedback: {
        type: String,
        default: null,
        maxlength: [500, 'Satisfaction feedback cannot exceed 500 characters']
      }
    }
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    authorRole: {
      type: String,
      enum: ['player', 'manager', 'admin'],
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    isInternal: {
      type: Boolean,
      default: false // Internal comments only visible to staff
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
complaintSchema.index({ 'submittedBy.userId': 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ 'assignedTo.adminId': 1 });

// Virtual for complaint age in days
complaintSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for response time (if resolved)
complaintSchema.virtual('responseTimeInHours').get(function() {
  if (this.resolution.resolvedAt) {
    return Math.floor((this.resolution.resolvedAt - this.createdAt) / (1000 * 60 * 60));
  }
  return null;
});

// Pre-save middleware to update resolution timestamp
complaintSchema.pre('save', function(next) {
  if (this.isModified('status') && (this.status === 'resolved' || this.status === 'closed')) {
    if (!this.resolution.resolvedAt) {
      this.resolution.resolvedAt = new Date();
    }
  }
  next();
});

// Static method to get complaint statistics
complaintSchema.statics.getStatistics = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        avgResponseTime: { 
          $avg: { 
            $cond: [
              { $ne: ['$resolution.resolvedAt', null] },
              { $divide: [{ $subtract: ['$resolution.resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
              null
            ]
          }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    avgResponseTime: 0
  };
};

module.exports = mongoose.model('Complaint', complaintSchema);
