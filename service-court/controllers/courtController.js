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
