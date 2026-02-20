const express = require('express');
const router = express.Router();
const multer = require('multer');
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/auth');
const {organization}  = require('../utils/validation');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/search', organization.search, organizationController.searchOrganizations);
router.get('/qr/:qrId', organization.qrIdParam, organizationController.getOrganizationByQr);

router.delete('/:organizationId/users/:userId', authMiddleware, organizationController.removeUserFromOrganization);

router.get('/:organizationId/users', authMiddleware, organizationController.getOrganizationUsers);


// Protected routes
router.use(authMiddleware);

// Create organization with optional picture upload
router.post(
  '/create',
  upload.single('picUrl'), // field name must match frontend
  organization.create,
  organizationController.createOrganization
);

// Get organization by ID
router.get('/:organizationId', organization.organizationIdParam, organizationController.getOrganizationById);

// Update organization with optional picture upload
router.patch(
  '/:organizationId',
  upload.single('picUrl'),
  organization.update,
  organizationController.updateOrganization
);

module.exports = router;