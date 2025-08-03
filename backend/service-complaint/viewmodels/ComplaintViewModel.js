const Complaint = require('../models/Complaint');
const axios = require('axios');

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';
const COURT_SERVICE_URL = process.env.COURT_SERVICE_URL || 'http://localhost:5001';
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:5003';

class ComplaintViewModel {
  // Create a new complaint with role-based validation
  static async createComplaint(complaintData, user) {
    try {
      // Validate complaint data based on user role
      const validatedData = await this._validateComplaintByRole(complaintData, user);
      
      // Enrich relatedTo data for court complaints
      let enrichedRelatedTo = validatedData.relatedTo || { type: 'general' };
      if (enrichedRelatedTo.type === 'court' && enrichedRelatedTo.referenceId) {
        const courtData = await this._getCourtData(enrichedRelatedTo.referenceId);
        if (courtData) {
          enrichedRelatedTo = {
            ...enrichedRelatedTo,
            companyId: courtData.companyId,
            companyName: courtData.company?.companyName || 'Unknown Company',
            location: courtData.location
          };
        } else {
          console.warn(`Could not fetch court data for court ID: ${enrichedRelatedTo.referenceId}`);
        }
      }
      
      // Enrich complaint with user and context data
      const enrichedComplaint = {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        priority: validatedData.priority || 'medium',
        status: 'open',
        submittedBy: {
          userId: user.userId,
          userName: user.fullName || user.email,
          userEmail: user.email,
          userRole: user.role.toLowerCase() // Convert to lowercase to match enum
        },
        relatedTo: enrichedRelatedTo,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const complaint = new Complaint(enrichedComplaint);
      await complaint.save();
      
      return {
        success: true,
        message: 'Complaint created successfully',
        data: complaint
      };
    } catch (error) {
      throw new Error(`Failed to create complaint: ${error.message}`);
    }
  }

  // Get complaints with role-based filtering
  static async getComplaints(filters = {}, pagination = {}, user) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      // Build query based on user role
      let query = await this._buildRoleBasedQuery(filters, user);

      const complaints = await Complaint.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Complaint.countDocuments(query);

      return {
        success: true,
        data: complaints,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: complaints.length,
          totalRecords: total
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch complaints: ${error.message}`);
    }
  }

  // Get user's complaints (for players and managers)
  static async getUserComplaints(userId, filters = {}, pagination = {}, user = null) {
    // For getUserComplaints, we need to add the user filter and pass the user object
    const userFilters = { ...filters, 'submittedBy.userId': userId };
    return this.getComplaints(userFilters, pagination, user);
  }

  // Get complaint by ID with role-based access control
  static async getComplaintById(complaintId, user) {
    try {
      const complaint = await Complaint.findById(complaintId);

      if (!complaint) {
        return {
          success: false,
          message: 'Complaint not found'
        };
      }

      // Check access permissions
      if (!this._hasComplaintAccess(complaint, user)) {
        return {
          success: false,
          message: 'Access denied. You do not have permission to view this complaint.'
        };
      }

      return {
        success: true,
        data: complaint
      };
    } catch (error) {
      throw new Error(`Failed to fetch complaint: ${error.message}`);
    }
  }

  // Update complaint status (admin/manager only)
  static async updateComplaintStatus(complaintId, status, user, resolution = null) {
    try {
      // Check permissions
      if (!this._canUpdateComplaintStatus(user)) {
        throw new Error('Access denied. Only admins and managers can update complaint status.');
      }

      const updateData = {
        status,
        updatedAt: new Date(),
        'assignedTo.adminId': user.userId,
        'assignedTo.adminName': user.fullName || user.email,
        'assignedTo.assignedAt': new Date()
      };

      if (resolution) {
        updateData['resolution.description'] = resolution;
        updateData['resolution.resolvedBy.adminId'] = user.userId;
        updateData['resolution.resolvedBy.adminName'] = user.fullName || user.email;
      }

      if (status === 'resolved') {
        updateData['resolution.resolvedAt'] = new Date();
      }

      const complaint = await Complaint.findByIdAndUpdate(
        complaintId,
        updateData,
        { new: true }
      );

      if (!complaint) {
        return {
          success: false,
          message: 'Complaint not found'
        };
      }

      return {
        success: true,
        message: 'Complaint status updated successfully',
        data: complaint
      };
    } catch (error) {
      throw new Error(`Failed to update complaint status: ${error.message}`);
    }
  }

  // Add comment to complaint
  static async addComment(complaintId, comment, user) {
    try {      
      const complaint = await Complaint.findById(complaintId);
      
      if (complaint) {
      }

      if (!complaint) {
        return {
          success: false,
          message: 'Complaint not found'
        };
      }

      // Check if complaint is closed
      if (complaint.status === 'closed') {
        return {
          success: false,
          message: 'Cannot add comments to a closed complaint'
        };
      }

      // Check access permissions
      if (!this._hasComplaintAccess(complaint, user)) {
        return {
          success: false,
          message: 'Access denied. You do not have permission to comment on this complaint.'
        };
      }

      const newComment = {
        content: comment,
        authorId: user.userId,
        authorName: user.fullName || user.email,
        authorRole: user.role.toLowerCase(), // Convert to lowercase to match enum
        createdAt: new Date()
      };

      console.log('🔍 DEBUG: New comment object:', JSON.stringify(newComment, null, 2));
      
      complaint.comments.push(newComment);
      complaint.updatedAt = new Date();
      
      await complaint.save();

      return {
        success: true,
        message: 'Comment added successfully',
        data: complaint
      };
    } catch (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  // Delete complaint (only by owner if pending, or admin)
  static async deleteComplaint(complaintId, user) {
    try {
      const complaint = await Complaint.findById(complaintId);

      if (!complaint) {
        return {
          success: false,
          message: 'Complaint not found'
        };
      }

      // Check permissions
      const isAdmin = user.role.toLowerCase() === 'admin';
      const isOwner = complaint.submittedBy.userId.toString() === user.userId;
      const isPending = complaint.status === 'open';

      if (!isAdmin && !(isOwner && isPending)) {
        return {
          success: false,
          message: 'Access denied. You can only delete your own pending complaints.'
        };
      }

      await Complaint.findByIdAndDelete(complaintId);

      return {
        success: true,
        message: 'Complaint deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete complaint: ${error.message}`);
    }
  }

  // Get complaint statistics with role-based filtering
  static async getComplaintStatistics(dateRange = {}, user) {
    try {
      // Build match stage based on user role
      let matchStage = {};
      
      if (dateRange.start || dateRange.end) {
        matchStage.createdAt = {};
        if (dateRange.start) matchStage.createdAt.$gte = dateRange.start;
        if (dateRange.end) matchStage.createdAt.$lte = dateRange.end;
      }

      // Apply role-based filtering
      if (user.role.toLowerCase() === 'manager') {
        // Managers see complaints related to their company's courts
        try {
          // Get manager's company information
          const managerCompany = await this._getManagerCompany(user.userId);
          if (managerCompany) {
            matchStage.$or = [
              { 'submittedBy.userId': user.userId }, // Their own complaints
              { 'relatedTo.companyId': managerCompany._id }, // Complaints about their courts
              { 
                $and: [
                  { category: { $in: ['court', 'facility', 'booking'] } },
                  { 'relatedTo.companyId': managerCompany._id }
                ]
              }
            ];
          } else {
            // If no company found, only show their own complaints
            matchStage['submittedBy.userId'] = user.userId;
          }
        } catch (error) {
          console.error('Error getting manager company:', error);
          // Fallback to only their own complaints
          matchStage['submittedBy.userId'] = user.userId;
        }
      } else if (user.role.toLowerCase() === 'player') {
        // Players see only their own complaints
        matchStage['submittedBy.userId'] = user.userId;
      }
      // Admins see all complaints (no additional filtering)

      const stats = await Complaint.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
          }
        }
      ]);

      const statusStats = stats[0] || {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0
      };

      // Get category breakdown
      const categoryStats = await Complaint.aggregate([
        { $match: matchStage },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Get priority breakdown
      const priorityStats = await Complaint.aggregate([
        { $match: matchStage },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return {
        success: true,
        data: {
          overview: statusStats,
          byCategory: categoryStats,
          byPriority: priorityStats
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch complaint statistics: ${error.message}`);
    }
  }

  // Private helper methods
  static async _validateComplaintByRole(complaintData, user) {
    const { title, description, category, priority, relatedTo } = complaintData;
    
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (!description || description.trim().length === 0) {
      throw new Error('Description is required');
    }
    if (!category) {
      throw new Error('Category is required');
    }

    const userRole = user.role.toLowerCase();
    const allowedCategories = this._getAllowedCategoriesByRole(userRole);
    
    if (!allowedCategories.includes(category)) {
      throw new Error(`Invalid category for ${userRole}. Allowed categories: ${allowedCategories.join(', ')}`);
    }

    return {
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority || 'medium',
      relatedTo
    };
  }

  static _getAllowedCategoriesByRole(role) {
    // Normalize role to handle case variations
    const normalizedRole = role.toLowerCase();
    
    switch (normalizedRole) {
      case 'player':
        return ['court', 'booking', 'facility', 'team', 'technical', 'other'];
      case 'manager':
        return ['payment', 'booking', 'court', 'facility', 'staff', 'technical', 'other'];
      case 'admin':
        return ['booking', 'court', 'payment', 'staff', 'facility', 'team', 'technical', 'other'];
      default:
        return ['other'];
    }
  }

  // Public method to get allowed categories
  static getAllowedCategoriesByRole(role) {
    return this._getAllowedCategoriesByRole(role);
  }

  static async _buildRoleBasedQuery(filters, user) {
    let query = {};
    
    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;
    if (filters.userId) query['submittedBy.userId'] = filters.userId;
    if (filters.dateRange) {
      query.createdAt = {};
      if (filters.dateRange.start) query.createdAt.$gte = filters.dateRange.start;
      if (filters.dateRange.end) query.createdAt.$lte = filters.dateRange.end;
    }

    // Apply role-based filtering
    if (!user || !user.role) {
      // If no user provided, return empty query (no results)
      console.warn('No user or user role provided for complaint query');
      return { _id: null }; // This will return no results
    }
    
    const userRole = user.role.toLowerCase();
    
    if (userRole === 'manager') {
      // Managers see complaints related to their company's courts
      try {
        // Get ALL companies owned by this manager
        const managerCompanies = await this._getAllManagerCompanies(user.userId);
        if (managerCompanies && managerCompanies.length > 0) {
          const allCompanyIds = managerCompanies.map(company => company._id);
          
          // Build a comprehensive query for all complaints this manager should see
          const managerComplaintConditions = [
            { 'submittedBy.userId': user.userId }, // Their own complaints
            { 'relatedTo.companyId': { $in: allCompanyIds } } // Complaints for any of their companies
          ];
          
          // For legacy complaints without companyId, check each court individually
          try {
            const Complaint = require('../models/Complaint');
            const legacyComplaints = await Complaint.find({
              'relatedTo.type': 'court',
              'relatedTo.companyId': null,
              'relatedTo.referenceId': { $exists: true }
            });
            
            const validCourtIds = [];
            for (const complaint of legacyComplaints) {
              try {
                const courtData = await this._getCourtData(complaint.relatedTo.referenceId);
                
                if (courtData && courtData.companyId && allCompanyIds.some(companyId => companyId.toString() === courtData.companyId.toString())) {
                  validCourtIds.push(complaint.relatedTo.referenceId);
                }
              } catch (error) {
                console.error(`Error checking court ${complaint.relatedTo.referenceId}:`, error.message);
              }
            }
            
            if (validCourtIds.length > 0) {
              managerComplaintConditions.push({
                $and: [
                  { 'relatedTo.type': 'court' },
                  { 'relatedTo.referenceId': { $in: validCourtIds } }
                ]
              });
            }
          } catch (error) {
            console.error('Error processing legacy complaints:', error);
          }
          
          query.$or = managerComplaintConditions;
        } else {
          query['submittedBy.userId'] = user.userId;
        }
      } catch (error) {
        console.error('Error getting manager company in query builder:', error);
        query['submittedBy.userId'] = user.userId;
      }
    } else if (userRole === 'player') {
      // Players only see their own complaints
      query['submittedBy.userId'] = user.userId;
    }
    // Admins see all complaints (no additional filtering)

    return query;
  }

  static async _hasComplaintAccess(complaint, user) {
    const userRole = user.role.toLowerCase();
    
    // Admin has access to all complaints
    if (userRole === 'admin') {
      return true;
    }
    
    // User can access their own complaints
    if (complaint.submittedBy.userId.toString() === user.userId) {
      return true;
    }
    
    // Manager can access complaints related to their company's courts
    if (userRole === 'manager') {
      try {
        const managerCompany = await this._getManagerCompany(user.userId);
        if (managerCompany && complaint.relatedTo?.companyId) {
          return complaint.relatedTo.companyId.toString() === managerCompany._id.toString();
        }
        // Fallback to old logic for backwards compatibility
        return (
          complaint.relatedTo?.referenceName === user.companyName ||
          ['court', 'facility', 'booking'].includes(complaint.category)
        );
      } catch (error) {
        console.error('Error checking manager access:', error);
        return false;
      }
    }
    
    return false;
  }

  static _canUpdateComplaintStatus(user) {
    const userRole = user.role.toLowerCase();
    return ['admin', 'manager'].includes(userRole);
  }

  // Helper method to get manager's company information
  static async _getManagerCompany(managerId) {
    try {
      const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://localhost:5001';
      const response = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/internal/owner/${managerId}`);
      
      // Company service returns array directly, not wrapped in success/data
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Return the first company (assuming manager owns one company)
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching manager company:', error.message);
      return null;
    }
  }

  // Helper method to get ALL companies owned by a manager
  static async _getAllManagerCompanies(managerId) {
    try {
      const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://localhost:5001';
      const response = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/internal/owner/${managerId}`);
      
      // Company service returns array directly
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching manager companies:', error.message);
      return [];
    }
  }

  // Helper method to get all courts owned by a company
  static async _getCourtsByCompany(companyId) {
    try {
      const COURT_SERVICE_URL = process.env.COURT_SERVICE_URL || 'http://localhost:5003';
      
      // Try multiple approaches to get courts
      try {
        // First try: company-specific endpoint (if it exists)
        const response = await axios.get(`${COURT_SERVICE_URL}/api/courts/company/${companyId}`);
        if (response.data && response.data.success) {
          return response.data.data || [];
        }
      } catch (error) {
        console.log('Company-specific courts endpoint not available, trying alternatives...');
      }
      
      try {
        // Second try: get all courts and filter (may require different endpoint)
        const allCourtsResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts/public`);
        if (allCourtsResponse.data && allCourtsResponse.data.success) {
          const allCourts = allCourtsResponse.data.data || [];
          return allCourts.filter(court => court.companyId && court.companyId.toString() === companyId.toString());
        }
      } catch (error) {
        console.log('Public courts endpoint not available, trying basic endpoint...');
      }
      
      try {
        // Third try: basic courts endpoint without auth
        const basicResponse = await axios.get(`${COURT_SERVICE_URL}/api/courts`);
        if (basicResponse.data) {
          // Handle different response formats
          const courts = basicResponse.data.success ? basicResponse.data.data : basicResponse.data;
          if (Array.isArray(courts)) {
            return courts.filter(court => court.companyId && court.companyId.toString() === companyId.toString());
          }
        }
      } catch (error) {
        console.log('Basic courts endpoint failed, using fallback...');
      }
      
      // Fallback: manually query the court database
      console.log('All court service endpoints failed, checking specific courts mentioned in complaints...');
      return await this._getSpecificCourtsForComplaintFiltering(companyId);
      
    } catch (error) {
      console.error('Error fetching courts by company:', error.message);
      return [];
    }
  }

  // Fallback method to check specific courts mentioned in complaints
  static async _getSpecificCourtsForComplaintFiltering(companyId) {
    try {
      // Get all complaints that might belong to this company
      const Complaint = require('../models/Complaint');
      const courtComplaintsWithoutCompanyId = await Complaint.find({
        'relatedTo.type': 'court',
        'relatedTo.companyId': null
      }).distinct('relatedTo.referenceId');
      
      const validCourts = [];
      
      // Check each court individually
      for (const courtId of courtComplaintsWithoutCompanyId) {
        try {
          const courtData = await this._getCourtData(courtId);
          if (courtData && courtData.companyId && courtData.companyId.toString() === companyId.toString()) {
            validCourts.push({ _id: courtId, companyId: courtData.companyId });
          }
        } catch (error) {
          console.log(`Could not check court ${courtId}:`, error.message);
        }
      }
      
      return validCourts;
    } catch (error) {
      console.error('Fallback court filtering failed:', error.message);
      return [];
    }
  }

  // Helper method to get court data with company information
  static async _getCourtData(courtId) {
    try {
      const COURT_SERVICE_URL = process.env.COURT_SERVICE_URL || 'http://localhost:5003';
      const response = await axios.get(`${COURT_SERVICE_URL}/api/courts/${courtId}`);
      
      // Try different response formats
      let courtData = null;
      if (response.data && response.data.success) {
        courtData = response.data.data;
      } else if (response.data) {
        // Maybe the response is direct data without success wrapper
        courtData = response.data;
      }
      
      if (courtData) {
        // If court has companyId, fetch company name
        if (courtData.companyId) {
          try {
            const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://localhost:5001';
            const companyResponse = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${courtData.companyId}`);
            
            if (companyResponse.data) {
              // Add company information to court data
              courtData.company = {
                companyId: courtData.companyId,
                companyName: companyResponse.data.companyName
              };
            }
          } catch (companyError) {
            console.error('Error fetching company data for court:', companyError.message);
            // Continue without company name if fetch fails
          }
        }
        
        return courtData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching court data:', error.message);
      return null;
    }
  }
}

module.exports = ComplaintViewModel;
