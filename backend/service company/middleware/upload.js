const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save to main uploads folder for consistency
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    // Use company id in filename for uniqueness
    const id = req.params && req.params.id ? req.params.id : 'unknown';
    cb(null, `company-logo-${id}-${Date.now()}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
