const Court = require('../models/Court');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/courts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'court-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Export the upload middleware for use in routes - make it optional
exports.uploadImage = (req, res, next) => {
  const uploadSingle = upload.single('image');
  uploadSingle(req, res, (err) => {
    if (err) {
      // Only return error for actual upload errors, not missing file
      if (err.code !== 'LIMIT_UNEXPECTED_FILE' && err.message !== 'Unexpected field') {
        return res.status(400).json({ error: err.message });
      }
    }
    next();
  });
};

exports.createCourt = async (req, res) => {
  try {
    const courtData = { ...req.body };
    
    // Check if company is approved before allowing court creation
    if (courtData.companyId) {
      try {
        const companyResponse = await axios.get(`${process.env.COMPANY_SERVICE_URL}/api/companies/${courtData.companyId}`, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
        
        const company = companyResponse.data;
        // Check if company is verified and active (approved)
        if (!company.isVerified || company.status !== 'Active') {
          return res.status(403).json({ 
            error: 'Company must be approved by admin before adding courts. Please contact an administrator.' 
          });
        }
      } catch (companyError) {
        console.error('Error checking company approval:', companyError);
        return res.status(400).json({ 
          error: 'Unable to verify company approval status. Please try again.' 
        });
      }
    }
    
    // Handle nested location object from FormData or JSON
    if (courtData['location[address]'] !== undefined || courtData['location[city]'] !== undefined) {
      courtData.location = {
        address: courtData['location[address]'] || '',
        city: courtData['location[city]'] || ''
      };
      delete courtData['location[address]'];
      delete courtData['location[city]'];
    }
    
    // Handle amenities array from FormData or JSON
    if (courtData.amenities && !Array.isArray(courtData.amenities)) {
      // If amenities is not an array, it might be FormData format
      const amenities = [];
      Object.keys(courtData).forEach(key => {
        if (key.startsWith('amenities[')) {
          amenities.push(courtData[key]);
          delete courtData[key];
        }
      });
      if (amenities.length > 0) {
        courtData.amenities = amenities;
      }
    }
    
    // If an image was uploaded, add the image path
    if (req.file) {
      courtData.image = `/uploads/courts/${req.file.filename}`;
    }
    
    // Remove any undefined values to prevent validation errors
    Object.keys(courtData).forEach(key => {
      if (courtData[key] === undefined || courtData[key] === 'undefined') {
        delete courtData[key];
      }
    });
    
    const court = new Court(courtData);
    await court.save();
    res.status(201).json(court);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getCourts = async (req, res) => {
  try {
    const courts = await Court.find();
    
    // Fetch company details for each court
    const courtsWithCompany = await Promise.all(
      courts.map(async (court) => {
        try {
          const companyResponse = await axios.get(`${process.env.COMPANY_SERVICE_URL}/api/companies/${court.companyId}`);
          return {
            ...court.toObject(),
            company: companyResponse.data
          };
        } catch (companyError) {
          console.error(`Error fetching company ${court.companyId}:`, companyError.message);
          return {
            ...court.toObject(),
            company: null
          };
        }
      })
    );
    
    res.json(courtsWithCompany);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourtsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const courts = await Court.find({ companyId });
    res.json(courts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourtById = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ error: 'Court not found' });
    
    // Fetch company details for this court
    try {
      const companyResponse = await axios.get(`${process.env.COMPANY_SERVICE_URL}/api/companies/${court.companyId}`);
      const courtWithCompany = {
        ...court.toObject(),
        company: companyResponse.data
      };
      res.json(courtWithCompany);
    } catch (companyError) {
      console.error(`Error fetching company ${court.companyId}:`, companyError.message);
      res.json({
        ...court.toObject(),
        company: null
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCourt = async (req, res) => {
  try {
    const courtData = { ...req.body };
    
    // Handle nested location object from FormData or JSON
    if (courtData['location[address]'] !== undefined || courtData['location[city]'] !== undefined) {
      courtData.location = {
        address: courtData['location[address]'] || '',
        city: courtData['location[city]'] || ''
      };
      delete courtData['location[address]'];
      delete courtData['location[city]'];
    }
    
    // Handle amenities array from FormData or JSON
    if (courtData.amenities && !Array.isArray(courtData.amenities)) {
      // If amenities is not an array, it might be FormData format
      const amenities = [];
      Object.keys(courtData).forEach(key => {
        if (key.startsWith('amenities[')) {
          amenities.push(courtData[key]);
          delete courtData[key];
        }
      });
      if (amenities.length > 0) {
        courtData.amenities = amenities;
      }
    }
    
    // If an image was uploaded, add the image path
    if (req.file) {
      courtData.image = `/uploads/courts/${req.file.filename}`;
    }
    
    // Remove any undefined values to prevent validation errors
    Object.keys(courtData).forEach(key => {
      if (courtData[key] === undefined || courtData[key] === 'undefined') {
        delete courtData[key];
      }
    });
    
    const court = await Court.findByIdAndUpdate(req.params.id, courtData, { 
      new: true,
      runValidators: true 
    });
    if (!court) return res.status(404).json({ error: 'Court not found' });
    
    res.json(court);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCourt = async (req, res) => {
  try {
    const court = await Court.findByIdAndDelete(req.params.id);
    if (!court) return res.status(404).json({ error: 'Court not found' });
    res.json({ message: 'Court deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Rating functionality
exports.addRating = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { rating, comment, userId } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Check if user has already rated this court
    const existingRating = court.ratings.find(r => r.userId.toString() === userId);
    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this court' });
    }

    // Add new rating
    court.ratings.push({
      userId,
      rating,
      comment: comment || '',
      createdAt: new Date()
    });

    // Recalculate average rating
    const totalRatings = court.ratings.length;
    const sumRatings = court.ratings.reduce((sum, r) => sum + r.rating, 0);
    court.averageRating = Math.round((sumRatings / totalRatings) * 10) / 10; // Round to 1 decimal
    court.totalRatings = totalRatings;

    await court.save();

    res.status(201).json({
      message: 'Rating added successfully',
      averageRating: court.averageRating,
      totalRatings: court.totalRatings
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateRating = async (req, res) => {
  try {
    const { courtId, ratingId } = req.params;
    const { rating, comment, userId } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Find the rating to update
    const ratingIndex = court.ratings.findIndex(r => 
      r._id.toString() === ratingId && r.userId.toString() === userId
    );

    if (ratingIndex === -1) {
      return res.status(404).json({ error: 'Rating not found or you are not authorized to update it' });
    }

    // Update rating
    court.ratings[ratingIndex].rating = rating;
    court.ratings[ratingIndex].comment = comment || court.ratings[ratingIndex].comment;

    // Recalculate average rating
    const totalRatings = court.ratings.length;
    const sumRatings = court.ratings.reduce((sum, r) => sum + r.rating, 0);
    court.averageRating = Math.round((sumRatings / totalRatings) * 10) / 10;

    await court.save();

    res.json({
      message: 'Rating updated successfully',
      averageRating: court.averageRating,
      totalRatings: court.totalRatings
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteRating = async (req, res) => {
  try {
    const { courtId, ratingId } = req.params;
    const { userId } = req.body;

    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Find and remove the rating
    const ratingIndex = court.ratings.findIndex(r => 
      r._id.toString() === ratingId && r.userId.toString() === userId
    );

    if (ratingIndex === -1) {
      return res.status(404).json({ error: 'Rating not found or you are not authorized to delete it' });
    }

    court.ratings.splice(ratingIndex, 1);

    // Recalculate average rating
    if (court.ratings.length > 0) {
      const totalRatings = court.ratings.length;
      const sumRatings = court.ratings.reduce((sum, r) => sum + r.rating, 0);
      court.averageRating = Math.round((sumRatings / totalRatings) * 10) / 10;
      court.totalRatings = totalRatings;
    } else {
      court.averageRating = 0;
      court.totalRatings = 0;
    }

    await court.save();

    res.json({
      message: 'Rating deleted successfully',
      averageRating: court.averageRating,
      totalRatings: court.totalRatings
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Helper function to fetch user data from auth service
const fetchUserData = async (userIds) => {
  try {
    const axios = require('axios');
    const response = await axios.post('http://localhost:5000/api/auth/users/bulk', {
      userIds: userIds
    });
    return response.data.users || [];
  } catch (error) {
    console.error('Error fetching user data:', error.message);
    return [];
  }
};

exports.getCourtRatings = async (req, res) => {
  try {
    const { courtId } = req.params;
    const court = await Court.findById(courtId);
    
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Get unique user IDs from ratings
    const userIds = [...new Set(court.ratings.map(rating => rating.userId.toString()))];
    
    // Fetch user data from auth service
    const users = await fetchUserData(userIds);
    
    // Create a map for quick user lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = user;
    });

    // Enrich ratings with user data
    const enrichedRatings = court.ratings.map(rating => ({
      ...rating.toObject(),
      userId: userMap[rating.userId.toString()] || { 
        _id: rating.userId,
        fullName: 'Unknown User',
        email: 'unknown@example.com',
        profileImage: null
      }
    }));

    res.json({
      ratings: enrichedRatings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      averageRating: court.averageRating,
      totalRatings: court.totalRatings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
