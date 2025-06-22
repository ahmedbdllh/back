const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');
const auth = require('../middleware/auth');
const managerCompanyAuth = require('../middleware/managerCompanyAuth');

// Create a new court (only for managers of the company)
router.post('/', auth, managerCompanyAuth, courtController.uploadImage, courtController.createCourt);

// Get all courts
router.get('/', courtController.getCourts);

// Get courts by companyId (requires auth to ensure manager can only see their company's courts)
router.get('/company/:companyId', auth, managerCompanyAuth, courtController.getCourtsByCompany);

// Get a single court by ID
router.get('/:id', courtController.getCourtById);

// Update a court
router.put('/:id', auth, managerCompanyAuth, courtController.uploadImage, courtController.updateCourt);

// Delete a court
router.delete('/:id', courtController.deleteCourt);

module.exports = router;
