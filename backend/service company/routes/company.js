const express = require('express');
const router = express.Router();
const {
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
  getCompanyListForSignup,
  getCompanyFilterOptions
} = require('../controllers/companyController');
const upload = require('../middleware/upload');

const { 
  authenticateToken, 
  requireRole, 
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

// Public routes
router.get('/list/signup', getCompanyListForSignup); // New public route for signup
router.get('/verified', getVerifiedCompanies);
router.get('/filter-options', authenticateToken, requireRole(['Admin']), getCompanyFilterOptions);
router.get('/:id', getCompanyById);

// Private routes (require authentication)
router.post('/', authenticateToken, requireRole(['Manager', 'Admin']), createCompany);
router.post('/auto-create', authenticateToken, autoCreateCompany); // Removed role requirement for new manager signup
router.get('/owner/:ownerId', authenticateToken, getCompaniesByOwner);
router.put('/:id', authenticateToken, updateCompany);
router.delete('/:id', authenticateToken, requireOwnershipOrAdmin, deleteCompany);
router.post('/:id/upload-logo', authenticateToken, upload.single('logo'), uploadCompanyLogo);

// Admin only routes
router.get('/', authenticateToken, requireRole(['Admin']), getAllCompanies);
router.patch('/:id/verify', authenticateToken, requireRole(['Admin']), verifyCompany);
router.patch('/:id/suspend', authenticateToken, requireRole(['Admin']), suspendCompany);

// Internal service routes (no auth required for microservice communication)
router.put('/approve-by-owner/:ownerId', approveCompanyByOwner);
router.patch('/:id/stats', updateCompanyStats);

module.exports = router;
