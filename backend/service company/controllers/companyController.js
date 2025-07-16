const Company = require('../models/Company');
const axios = require('axios'); // Import axios for API calls

// Simple in-memory cache to prevent rapid successive identical requests
let lastRequestCache = {};
const REQUEST_THROTTLE_MS = 1000; // 1 second throttle

const createCompany = async (req, res) => {
  try {
    const companyData = { ...req.body, ownerId: req.user.id };
    const company = new Company(companyData);
    await company.save();
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const autoCreateCompany = async (req, res) => {
  try {
    console.log('=== AUTO CREATE COMPANY DEBUG ===');
    console.log('Request headers:', req.headers);
    console.log('Auto-creating company with data:', req.body);
    console.log('User from token:', req.user);
    console.log('=====================================');
    
    // Use data from request body (sent from auth service)
    const companyData = {
      ...req.body,
      ownerId: req.user.id || req.user._id
    };
    
    console.log('Final company data to save:', companyData);
    
    const company = new Company(companyData);
    await company.save();
    console.log('Company created successfully:', company);
    res.status(201).json(company);
  } catch (error) {
    console.error('Error in autoCreateCompany:', error);
    console.error('Validation errors:', error.errors);
    res.status(400).json({ message: error.message, errors: error.errors });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    // Create a cache key based on query parameters and user
    const cacheKey = `${req.user?.id || 'unknown'}_${JSON.stringify(req.query)}`;
    const now = Date.now();
    
    // Check if this exact request was made recently
    if (lastRequestCache[cacheKey] && (now - lastRequestCache[cacheKey]) < REQUEST_THROTTLE_MS) {
      console.log('Throttling rapid request for:', cacheKey);
      return res.status(429).json({ 
        message: 'Too many requests, please wait before trying again',
        retryAfter: REQUEST_THROTTLE_MS
      });
    }
    
    // Update cache
    lastRequestCache[cacheKey] = now;
    
    // Clean old cache entries (older than 5 seconds)
    Object.keys(lastRequestCache).forEach(key => {
      if (now - lastRequestCache[key] > 5000) {
        delete lastRequestCache[key];
      }
    });

    console.log('Starting to fetch companies with search parameters:', req.query);

    // Extract search parameters
    const {
      search = '',
      status = 'all',
      industry = 'all',
      isVerified = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build search query
    let searchQuery = {};

    // Text search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      searchQuery.$or = [
        { companyName: searchRegex },
        { description: searchRegex },
        { 'address.city': searchRegex },
        { 'address.country': searchRegex },
        { industry: searchRegex }
      ];
    }

    // Filter by status
    if (status && status !== 'all') {
      searchQuery.status = status;
    }

    // Filter by industry
    if (industry && industry !== 'all') {
      searchQuery.industry = industry;
    }

    // Filter by verification status
    if (isVerified && isVerified !== 'all') {
      searchQuery.isVerified = isVerified === 'true';
    }

    console.log('Final search query:', JSON.stringify(searchQuery, null, 2));

    // Build sort object
    let sortObj = {};
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      sortObj[sortBy] = order;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const companies = await Company.find(searchQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Company.countDocuments(searchQuery);

    if (!companies || companies.length === 0) {
      return res.status(200).json({
        companies: [],
        pagination: {
          total: 0,
          page: pageNum,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    console.log(`Found ${companies.length} companies matching search criteria`);

    // Populate owner details for each company
    const populatedCompanies = await Promise.all(
      companies.map(async (company) => {
        if (company.ownerId) {
          console.log(`Processing company: ${company.companyName}, ownerId: ${company.ownerId}`);
          try {
            // Call the auth service to get user details
            const userResponse = await axios.get(`http://localhost:5000/api/auth/user/${company.ownerId}`);
            console.log(`Auth service response for ownerId ${company.ownerId}:`, userResponse.data);
            
            if (userResponse.data && userResponse.data.user) {
              console.log(`User details found for ownerId ${company.ownerId}:`, userResponse.data.user); 

              const owner_Id = userResponse.data.user._id || userResponse.data.user.id;
              const ownerFullName = userResponse.data.user.fullName;
              const ownerEmail = userResponse.data.user.email;

              console.log(`Extracted for ownerId ${company.ownerId}: _id='${owner_Id}', fullName='${ownerFullName}', email='${ownerEmail}'`);

              const newOwnerIdObject = {
                _id: owner_Id,
                fullName: ownerFullName,
                email: ownerEmail,
              };

              console.log(`Constructed newOwnerIdObject for ${company.ownerId}:`, JSON.stringify(newOwnerIdObject, null, 2));

              return {
                ...company,
                ownerId: newOwnerIdObject,
              };
            } else {
              console.log(`User details *not found* in auth response for ownerId ${company.ownerId}. Response data:`, userResponse.data);
              return { ...company, ownerId: { fullName: 'Owner not found (no user data)', email: 'N/A' } };
            }
          } catch (authError) {
            console.error(`Failed to fetch user details for ownerId ${company.ownerId}:`, authError.message);
            if (authError.response) {
              console.error(`Auth service error response for ownerId ${company.ownerId}:`, authError.response.data);
            }
            
            // Check if it's a 404 (user not found) or other error
            if (authError.response && authError.response.status === 404) {
              return { ...company, ownerId: { fullName: 'User not found (404)', email: 'N/A' } };
            } else {
              return { ...company, ownerId: { fullName: 'Error fetching owner', email: 'N/A' } };
            }
          }
        }
        console.log(`Company ${company.companyName} has no ownerId.`);
        return company;
      })
    );

    console.log('Finished populating companies with search results');

    // Prepare pagination info
    const pagination = {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1,
      limit: limitNum
    };

    res.status(200).json({
      companies: populatedCompanies,
      pagination,
      searchParams: {
        search,
        status,
        industry,
        isVerified,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Error fetching all companies:', error);
    res.status(500).json({ 
      message: 'Error fetching companies', 
      error: error.message,
      companies: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 0,
        hasNext: false,
        hasPrev: false
      }
    });
  }
};

const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
const getCompaniesByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const companies = await Company.find({ ownerId });
    res.json(companies);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json({ company });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const verifyCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { 
        isVerified: true,
        status: 'Active'
      },
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json({ success: true, company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const suspendCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { 
        isVerified: false,
        status: 'Suspended'
      },
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json({ success: true, company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getVerifiedCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isVerified: true });
    res.json(companies);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateCompanyStats = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { stats: req.body.stats },
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { logo: logoUrl },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ logoUrl, company });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(400).json({ message: error.message });
  }
};

const approveCompanyByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    // Find and update the company owned by this user
    const company = await Company.findOneAndUpdate(
      { ownerId: ownerId },
      { 
        isVerified: true,
        status: 'Active',
        verifiedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found for this owner' });
    }
    
    res.json({ 
      message: 'Company approved successfully',
      company 
    });
  } catch (error) {
    console.error('Error approving company by owner:', error);
    res.status(400).json({ message: error.message });
  }
};

const getCompanyListForSignup = async (req, res) => {
  try {
    // Fetch only company name and ID for active and verified companies, suitable for a signup dropdown
    const companies = await Company.find({ isVerified: true, isActive: true })
      .select('_id companyName') // Only fetch necessary fields
      .sort({ companyName: 1 }) // Optional: sort by name
      .lean();

    // companies will be an array, possibly empty. Responding with an empty array is fine.
    res.status(200).json(companies);
  } catch (error) {
    console.error('Error in getCompanyListForSignup:', error);
    res.status(500).json({ message: 'Failed to fetch company list for signup.' });
  }
};

const getCompanyFilterOptions = async (req, res) => {
  try {
    console.log('Fetching filter options for companies...');
    
    // Get unique industries
    const industries = await Company.distinct('industry');
    
    // Get unique statuses
    const statuses = await Company.distinct('status');
    
    // Get verification status counts
    const verifiedCount = await Company.countDocuments({ isVerified: true });
    const unverifiedCount = await Company.countDocuments({ isVerified: false });
    
    // Build industries with counts
    const industriesWithCounts = await Promise.all(
      industries.filter(Boolean).map(async (industry) => ({
        value: industry,
        label: industry,
        count: await Company.countDocuments({ industry })
      }))
    );
    
    // Build statuses with counts
    const statusesWithCounts = await Promise.all(
      statuses.filter(Boolean).map(async (status) => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count: await Company.countDocuments({ status })
      }))
    );
    
    const filterOptions = {
      industries: industriesWithCounts,
      statuses: statusesWithCounts,
      verificationStatus: [
        { value: 'true', label: 'Verified', count: verifiedCount },
        { value: 'false', label: 'Not Verified', count: unverifiedCount }
      ]
    };
    
    res.status(200).json(filterOptions);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ 
      message: 'Error fetching filter options', 
      error: error.message 
    });
  }
};

module.exports = {
  createCompany,
  autoCreateCompany,
  getAllCompanies,
  getCompanyById,
  getCompaniesByOwner,
  updateCompany,
  verifyCompany,
  suspendCompany,
  deleteCompany,
  getVerifiedCompanies,
  updateCompanyStats,
  uploadCompanyLogo,
  approveCompanyByOwner,
  getCompanyListForSignup, // Added new function for signup
  getCompanyFilterOptions, // Added new function for filter options
};