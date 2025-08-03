const ComplaintViewModel = require('../viewmodels/ComplaintViewModel');
const SupportViewModel = require('../viewmodels/SupportViewModel');

class ComplaintService {
  constructor() {
    this.complaintViewModel = new ComplaintViewModel();
    this.supportViewModel = new SupportViewModel();
  }

  // Complaint CRUD Operations
  async createComplaint(complaintData, userId) {
    try {
      return await this.complaintViewModel.createComplaint(complaintData, userId);
    } catch (error) {
      throw this._handleServiceError('Failed to create complaint', error);
    }
  }

  async getComplaint(complaintId, userId) {
    try {
      return await this.complaintViewModel.getComplaint(complaintId, userId);
    } catch (error) {
      throw this._handleServiceError('Failed to retrieve complaint', error);
    }
  }

  async getAllComplaints(userId, filters = {}) {
    try {
      return await this.complaintViewModel.getAllComplaints(userId, filters);
    } catch (error) {
      throw this._handleServiceError('Failed to retrieve complaints', error);
    }
  }

  async updateComplaint(complaintId, updateData, userId) {
    try {
      return await this.complaintViewModel.updateComplaint(complaintId, updateData, userId);
    } catch (error) {
      throw this._handleServiceError('Failed to update complaint', error);
    }
  }

  async deleteComplaint(complaintId, userId) {
    try {
      return await this.complaintViewModel.deleteComplaint(complaintId, userId);
    } catch (error) {
      throw this._handleServiceError('Failed to delete complaint', error);
    }
  }

  // Comment Management
  async addComment(complaintId, commentData, userId) {
    try {
      return await this.complaintViewModel.addComment(complaintId, commentData, userId);
    } catch (error) {
      throw this._handleServiceError('Failed to add comment', error);
    }
  }

  async updateComment(complaintId, commentId, commentData, userId) {
    try {
      return await this.complaintViewModel.updateComment(complaintId, commentId, commentData, userId);
    } catch (error) {
      throw this._handleServiceError('Failed to update comment', error);
    }
  }

  async deleteComment(complaintId, commentId, userId) {
    try {
      return await this.complaintViewModel.deleteComment(complaintId, commentId, userId);
    } catch (error) {
      throw this._handleServiceError('Failed to delete comment', error);
    }
  }

  // Status Management
  async updateStatus(complaintId, status, userId, isAdmin = false) {
    try {
      return await this.complaintViewModel.updateStatus(complaintId, status, userId, isAdmin);
    } catch (error) {
      throw this._handleServiceError('Failed to update status', error);
    }
  }

  async updatePriority(complaintId, priority, userId) {
    try {
      return await this.complaintViewModel.updatePriority(complaintId, priority, userId);
    } catch (error) {
      throw this._handleServiceError('Failed to update priority', error);
    }
  }

  // Resolution and Satisfaction
  async resolveComplaint(complaintId, resolutionData, userId) {
    try {
      return await this.complaintViewModel.resolveComplaint(complaintId, resolutionData, userId);
    } catch (error) {
      throw this._handleServiceError('Failed to resolve complaint', error);
    }
  }

  async addSatisfactionRating(complaintId, rating, feedback, userId) {
    try {
      return await this.complaintViewModel.addSatisfactionRating(complaintId, rating, feedback, userId);
    } catch (error) {
      throw this._handleServiceError('Failed to add satisfaction rating', error);
    }
  }

  // Analytics and Statistics
  async getComplaintStatistics(userId, timeframe = '30days') {
    try {
      return await this.complaintViewModel.getComplaintStatistics(userId, timeframe);
    } catch (error) {
      throw this._handleServiceError('Failed to retrieve statistics', error);
    }
  }

  async getComplaintTrends(filters = {}) {
    try {
      return await this.complaintViewModel.getComplaintTrends(filters);
    } catch (error) {
      throw this._handleServiceError('Failed to retrieve trends', error);
    }
  }

  // Search and Filter
  async searchComplaints(searchTerm, userId, filters = {}) {
    try {
      return await this.complaintViewModel.searchComplaints(searchTerm, userId, filters);
    } catch (error) {
      throw this._handleServiceError('Failed to search complaints', error);
    }
  }

  // Support Operations
  async getSupportCategories() {
    try {
      return await this.supportViewModel.getCategories();
    } catch (error) {
      throw this._handleServiceError('Failed to retrieve support categories', error);
    }
  }

  async getFAQ(filters = {}) {
    try {
      return await this.supportViewModel.getFAQ(filters);
    } catch (error) {
      throw this._handleServiceError('Failed to retrieve FAQ', error);
    }
  }

  async getContactInfo() {
    try {
      return await this.supportViewModel.getContactInfo();
    } catch (error) {
      throw this._handleServiceError('Failed to retrieve contact information', error);
    }
  }

  async submitQuickHelp(helpData) {
    try {
      return await this.supportViewModel.submitQuickHelp(helpData);
    } catch (error) {
      throw this._handleServiceError('Failed to submit help request', error);
    }
  }

  async getSystemStatus() {
    try {
      return await this.supportViewModel.getSystemStatus();
    } catch (error) {
      throw this._handleServiceError('Failed to retrieve system status', error);
    }
  }

  async searchSupport(searchTerm, filters = {}) {
    try {
      return await this.supportViewModel.searchSupport(searchTerm, filters);
    } catch (error) {
      throw this._handleServiceError('Failed to search support resources', error);
    }
  }

  // Bulk Operations
  async bulkUpdateComplaints(complaintIds, updateData, userId) {
    try {
      const results = {
        successful: [],
        failed: [],
        total: complaintIds.length
      };

      for (const complaintId of complaintIds) {
        try {
          const result = await this.complaintViewModel.updateComplaint(complaintId, updateData, userId);
          results.successful.push({
            complaintId,
            result
          });
        } catch (error) {
          results.failed.push({
            complaintId,
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: `Updated ${results.successful.length} of ${results.total} complaints`,
        data: results
      };

    } catch (error) {
      throw this._handleServiceError('Failed to bulk update complaints', error);
    }
  }

  async exportComplaints(userId, filters = {}, format = 'json') {
    try {
      const complaints = await this.complaintViewModel.getAllComplaints(userId, { ...filters, limit: 10000 });
      
      if (format === 'csv') {
        return this._convertToCSV(complaints.complaints);
      }
      
      return complaints;

    } catch (error) {
      throw this._handleServiceError('Failed to export complaints', error);
    }
  }

  // Data Import/Migration
  async importComplaints(complaintsData, userId) {
    try {
      const results = {
        imported: [],
        failed: [],
        total: complaintsData.length
      };

      for (const complaintData of complaintsData) {
        try {
          const result = await this.complaintViewModel.createComplaint(complaintData, userId);
          results.imported.push(result);
        } catch (error) {
          results.failed.push({
            data: complaintData,
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: `Imported ${results.imported.length} of ${results.total} complaints`,
        data: results
      };

    } catch (error) {
      throw this._handleServiceError('Failed to import complaints', error);
    }
  }

  // Notification and Communication
  async sendNotification(complaintId, notificationData, userId) {
    try {
      // In a real implementation, this would integrate with a notification service
      const complaint = await this.complaintViewModel.getComplaint(complaintId, userId);
      
      if (!complaint.success) {
        throw new Error('Complaint not found');
      }

      // Simulate notification sending
      const notification = {
        id: this._generateId(),
        complaintId,
        type: notificationData.type || 'update',
        message: notificationData.message,
        recipient: complaint.complaint.userId,
        sentAt: new Date().toISOString(),
        status: 'sent'
      };

      console.log('Notification sent:', notification);

      return {
        success: true,
        message: 'Notification sent successfully',
        notification
      };

    } catch (error) {
      throw this._handleServiceError('Failed to send notification', error);
    }
  }

  // Private helper methods
  _convertToCSV(complaints) {
    if (!complaints || complaints.length === 0) {
      return '';
    }

    const headers = ['ID', 'Title', 'Category', 'Status', 'Priority', 'Created Date', 'Resolved Date', 'Satisfaction Rating'];
    const csvRows = [headers.join(',')];

    complaints.forEach(complaint => {
      const row = [
        complaint._id,
        `"${complaint.title.replace(/"/g, '""')}"`,
        complaint.category,
        complaint.status,
        complaint.priority,
        complaint.createdAt,
        complaint.resolvedAt || '',
        complaint.satisfaction?.rating || ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  _generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  _handleServiceError(message, error) {
    console.error(`ComplaintService Error: ${message}`, error);
    return new Error(`${message}: ${error.message}`);
  }

  // Health Check
  async healthCheck() {
    try {
      const checks = {
        viewModel: false,
        supportViewModel: false,
        database: false,
        timestamp: new Date().toISOString()
      };

      // Check ViewModels
      try {
        checks.viewModel = this.complaintViewModel !== null;
        checks.supportViewModel = this.supportViewModel !== null;
      } catch (error) {
        console.error('ViewModel health check failed:', error);
      }

      // Check database connection (would be implemented based on actual DB)
      try {
        // This would ping the actual database
        checks.database = true;
      } catch (error) {
        console.error('Database health check failed:', error);
      }

      const allHealthy = Object.values(checks).every(check => check === true || typeof check === 'string');

      return {
        success: true,
        healthy: allHealthy,
        checks,
        message: allHealthy ? 'All systems operational' : 'Some systems experiencing issues'
      };

    } catch (error) {
      return {
        success: false,
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = ComplaintService;
