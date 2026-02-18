const express = require('express');
const router = express.Router();
const multer = require('multer');
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/auth');
const organizationValidation  = require('../utils/validation');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/search', organizationValidation.search, organizationController.searchOrganizations);
router.get('/qr/:qrId', organizationValidation.qrIdParam, organizationController.getOrganizationByQr);

// Protected routes
router.use(authMiddleware);

// Create organization with optional picture upload
router.post(
  '/create',
  upload.single('picUrl'), // field name must match frontend
  organizationValidation.create,
  organizationController.createOrganization
);

// Get organization by ID
router.get('/:organizationId', organizationValidation.organizationIdParam, organizationController.getOrganizationById);

// Update organization with optional picture upload
router.patch(
  '/:organizationId',
  upload.single('picUrl'),
  organizationValidation.update,
  organizationController.updateOrganization
);

module.exports = router;