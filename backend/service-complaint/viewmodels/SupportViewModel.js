class SupportViewModel {
  // Get support categories
  static async getSupportCategories() {
    try {
      const categories = [
        {
          id: 'account',
          name: 'Account Issues',
          description: 'Login problems, password reset, profile updates',
          icon: 'user'
        },
        {
          id: 'booking',
          name: 'Booking & Reservations',
          description: 'Court bookings, cancellations, scheduling conflicts',
          icon: 'calendar'
        },
        {
          id: 'payment',
          name: 'Payment & Billing',
          description: 'Payment issues, refunds, billing questions',
          icon: 'credit-card'
        },
        {
          id: 'technical',
          name: 'Technical Support',
          description: 'App bugs, website issues, feature problems',
          icon: 'settings'
        },
        {
          id: 'general',
          name: 'General Inquiry',
          description: 'Other questions and general support',
          icon: 'help-circle'
        }
      ];

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      throw new Error(`Failed to fetch support categories: ${error.message}`);
    }
  }

  // Get FAQ items
  static async getFAQItems(category = null) {
    try {
      const faqData = [
        {
          id: 1,
          category: 'account',
          question: 'How do I reset my password?',
          answer: 'Click on "Forgot Password" on the login page and enter your email address. You will receive a password reset link.'
        },
        {
          id: 2,
          category: 'account',
          question: 'How do I update my profile information?',
          answer: 'Go to your profile page and click the "Edit" button. Make your changes and save.'
        },
        {
          id: 3,
          category: 'booking',
          question: 'How do I book a court?',
          answer: 'Navigate to the booking page, select your preferred date and time, choose a court, and confirm your booking.'
        },
        {
          id: 4,
          category: 'booking',
          question: 'Can I cancel my booking?',
          answer: 'Yes, you can cancel your booking up to 2 hours before the scheduled time through your bookings page.'
        },
        {
          id: 5,
          category: 'payment',
          question: 'What payment methods do you accept?',
          answer: 'We accept credit cards, debit cards, and online banking payments.'
        },
        {
          id: 6,
          category: 'payment',
          question: 'How do I request a refund?',
          answer: 'Refunds can be requested through the support page or by contacting customer service directly.'
        },
        {
          id: 7,
          category: 'technical',
          question: 'The app is not working properly, what should I do?',
          answer: 'Try refreshing the page or restarting the app. If the problem persists, please report it through the feedback form.'
        },
        {
          id: 8,
          category: 'general',
          question: 'What are your operating hours?',
          answer: 'Our courts are open from 6:00 AM to 11:00 PM, Monday through Sunday.'
        }
      ];

      let filteredFAQ = faqData;
      if (category) {
        filteredFAQ = faqData.filter(item => item.category === category);
      }

      return {
        success: true,
        data: filteredFAQ,
        total: filteredFAQ.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch FAQ items: ${error.message}`);
    }
  }

  // Get contact information
  static async getContactInfo() {
    try {
      const contactInfo = {
        phone: '+1 (555) 123-4567',
        email: 'support@courtsystem.com',
        address: '123 Sports Complex Ave, City, State 12345',
        businessHours: {
          weekdays: '9:00 AM - 6:00 PM',
          weekends: '10:00 AM - 4:00 PM'
        },
        emergencyContact: '+1 (555) 987-6543',
        socialMedia: {
          facebook: 'https://facebook.com/courtsystem',
          twitter: 'https://twitter.com/courtsystem',
          instagram: 'https://instagram.com/courtsystem'
        }
      };

      return {
        success: true,
        data: contactInfo
      };
    } catch (error) {
      throw new Error(`Failed to fetch contact information: ${error.message}`);
    }
  }

  // Submit quick help request
  static async submitQuickHelp(helpData) {
    try {
      // In a real implementation, this would save to database
      const helpRequest = {
        id: Date.now().toString(),
        ...helpData,
        status: 'pending',
        createdAt: new Date(),
        priority: 'normal'
      };

      // Log the help request (in real app, save to database)
      console.log('Quick help request submitted:', helpRequest);

      return {
        success: true,
        message: 'Help request submitted successfully. We will get back to you within 24 hours.',
        data: {
          requestId: helpRequest.id,
          status: helpRequest.status,
          submittedAt: helpRequest.createdAt
        }
      };
    } catch (error) {
      throw new Error(`Failed to submit help request: ${error.message}`);
    }
  }

  // Get support guidelines
  static async getSupportGuidelines() {
    try {
      const guidelines = {
        responseTime: {
          general: '24 hours',
          urgent: '4 hours',
          emergency: '1 hour'
        },
        escalationProcess: [
          'Initial support team review',
          'Technical team assessment (if applicable)',
          'Management review (for complex issues)',
          'Resolution and follow-up'
        ],
        bestPractices: [
          'Provide clear and detailed descriptions of issues',
          'Include screenshots or error messages when possible',
          'Specify the device and browser you are using',
          'Mention any recent changes or actions that might be related'
        ],
        contactPreferences: [
          'For general questions: Use the FAQ section first',
          'For account issues: Use the support form',
          'For emergencies: Call the emergency hotline',
          'For technical issues: Provide detailed system information'
        ]
      };

      return {
        success: true,
        data: guidelines
      };
    } catch (error) {
      throw new Error(`Failed to fetch support guidelines: ${error.message}`);
    }
  }

  // Get help requests (admin function)
  static async getHelpRequests(filters = {}, pagination = {}) {
    try {
      // In a real implementation, this would query the database
      const { page = 1, limit = 10 } = pagination;
      
      // Mock data for demonstration
      const mockRequests = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Booking Issue',
          message: 'Cannot book court for tomorrow',
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          priority: 'normal'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          subject: 'Payment Problem',
          message: 'Payment failed but money was deducted',
          status: 'in-progress',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          priority: 'high'
        }
      ];

      let filteredRequests = mockRequests;
      
      if (filters.status) {
        filteredRequests = filteredRequests.filter(req => req.status === filters.status);
      }
      
      if (filters.dateRange) {
        filteredRequests = filteredRequests.filter(req => {
          const createdAt = new Date(req.createdAt);
          if (filters.dateRange.start && createdAt < filters.dateRange.start) return false;
          if (filters.dateRange.end && createdAt > filters.dateRange.end) return false;
          return true;
        });
      }

      const total = filteredRequests.length;
      const skip = (page - 1) * limit;
      const paginatedRequests = filteredRequests.slice(skip, skip + limit);

      return {
        success: true,
        data: paginatedRequests,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: paginatedRequests.length,
          totalRecords: total
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch help requests: ${error.message}`);
    }
  }
}

module.exports = SupportViewModel;
